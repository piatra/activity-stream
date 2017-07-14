const injector = require("inject!lib/ManualMigration.jsm");
const {actionCreators: ac, actionTypes: at} = require("common/Actions.jsm");
const {GlobalOverrider} = require("test/unit/utils");

describe("ManualMigration", () => {
  let dispatch;
  let store;
  let instance;
  let globals;

  let migrationWizardStub;
  let fakeServices;
  let fakePrefs;

  beforeEach(() => {
    migrationWizardStub = sinon.stub();
    let fakeMigrationUtils = {
      showMigrationWizard: migrationWizardStub,
      MIGRATION_ENTRYPOINT_NEWTAB: "MIGRATION_ENTRYPOINT_NEWTAB"
    };
    fakeServices = {
      obs: {
        addObserver: sinon.stub(),
        removeObserver: sinon.stub()
      }
    };
    fakePrefs = function() {};
    fakePrefs.get = sinon.stub();
    fakePrefs.set = sinon.stub();

    const {ManualMigration} = injector({"lib/ActivityStreamPrefs.jsm": {Prefs: fakePrefs}});

    globals = new GlobalOverrider();
    globals.set("Services", fakeServices);
    globals.set("MigrationUtils", fakeMigrationUtils);

    dispatch = sinon.stub();
    store = {dispatch};
    instance = new ManualMigration();
    instance.store = store;
  });

  afterEach(() => {
    globals.restore();
  });

  it("should set an event listener for Migration:Ended", () => {
    assert.calledOnce(fakeServices.obs.addObserver);
    assert.calledWith(fakeServices.obs.addObserver, instance, "Migration:Ended");
  });

  describe("onAction", () => {
    it("should call expireIfNecessary on PREFS_INITIAL_VALUE", () => {
      const action = {
        type: at.PREFS_INITIAL_VALUES,
        data: {migrationExpired: true}
      };

      const expireStub = sinon.stub(instance, "expireIfNecessary");
      instance.onAction(action);

      assert.calledOnce(expireStub);
      assert.calledWithExactly(expireStub, action.data.migrationExpired);
    });
    it("should call launch the migration wizard on MIGRATION_START", () => {
      const action = {
        type: at.MIGRATION_START,
        _target: {browser: {ownerGlobal: "browser.xul"}},
        data: {migrationExpired: false}
      };

      instance.onAction(action);

      assert.calledOnce(migrationWizardStub);
      assert.calledWithExactly(migrationWizardStub, action._target.browser.ownerGlobal, ["MIGRATION_ENTRYPOINT_NEWTAB"]);
    });
    it("should set migrationStatus to true on MIGRATION_CANCEL", () => {
      const action = {type: at.MIGRATION_CANCEL};

      const setStatusStub = sinon.spy(instance, "expireMigration");
      instance.onAction(action);

      assert.calledOnce(setStatusStub);
      assert.calledOnce(dispatch);
      assert.calledWithExactly(dispatch, ac.SetPref("migrationExpired", true));
    });
    it("should set migrationStatus when isMigrationMessageExpired is true", () => {
      const setStatusStub = sinon.stub(instance, "expireMigration");
      const isExpiredStub = sinon.stub(instance, "isMigrationMessageExpired");
      isExpiredStub.returns(true);

      instance.expireIfNecessary(false);
      assert.calledOnce(setStatusStub);
    });
    it("should call isMigrationMessageExpired if migrationExpired is false", () => {
      const action = {
        type: at.PREFS_INITIAL_VALUES,
        data: {migrationExpired: false}
      };

      const stub = sinon.stub(instance, "isMigrationMessageExpired");
      instance.onAction(action);

      assert.calledOnce(stub);
    });
    describe("isMigrationMessageExpired", () => {
      beforeEach(() => {
        instance._prefs = fakePrefs;
      });
      it("should check migrationLastShownDate (case: today)", () => {
        const action = {
          type: at.PREFS_INITIAL_VALUES,
          data: {migrationExpired: false}
        };
        let today = new Date();
        today = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const migrationSpy = sinon.spy(instance, "isMigrationMessageExpired");
        fakePrefs.get.returns(today);
        instance.onAction(action);

        assert.calledOnce(migrationSpy);
        assert.calledOnce(fakePrefs.get);
        assert.calledWithExactly(fakePrefs.get, "migrationLastShownDate");
      });
      it("should return false if lastShownDate is today", () => {
        let today = new Date();
        today = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const migrationSpy = sinon.spy(instance, "isMigrationMessageExpired");
        fakePrefs.get.returns(today);
        const ret = instance.isMigrationMessageExpired();

        assert.calledOnce(migrationSpy);
        assert.calledOnce(fakePrefs.get);
        assert.equal(ret, false);
      });
      it("should check migrationLastShownDate (case: yesterday)", () => {
        const action = {
          type: at.PREFS_INITIAL_VALUES,
          data: {migrationExpired: false}
        };
        let today = new Date();
        let yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

        const migrationSpy = sinon.spy(instance, "isMigrationMessageExpired");
        fakePrefs.get.withArgs("migrationLastShownDate").returns(yesterday.valueOf() / 1000);
        fakePrefs.get.withArgs("migrationRemainingDays").returns(4);
        instance.onAction(action);

        assert.calledOnce(migrationSpy);
        assert.calledTwice(fakePrefs.get);
        assert.calledWithExactly(fakePrefs.get, "migrationLastShownDate");
        assert.calledWithExactly(fakePrefs.get, "migrationRemainingDays");
      });
      it("should update the migration prefs", () => {
        const action = {
          type: at.PREFS_INITIAL_VALUES,
          data: {migrationExpired: false}
        };
        let today = new Date();
        let yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
        today = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const migrationSpy = sinon.spy(instance, "isMigrationMessageExpired");
        fakePrefs.get.withArgs("migrationLastShownDate").returns(yesterday.valueOf() / 1000);
        fakePrefs.get.withArgs("migrationRemainingDays").returns(4);
        instance.onAction(action);

        assert.calledOnce(migrationSpy);
        assert.calledTwice(fakePrefs.set);
        assert.calledWithExactly(fakePrefs.set, "migrationRemainingDays", 3);
        assert.calledWithExactly(fakePrefs.set, "migrationLastShownDate", today.valueOf() / 1000);
      });
      it("should return true if remainingDays reaches 0", () => {
        let today = new Date();
        let yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

        const migrationSpy = sinon.spy(instance, "isMigrationMessageExpired");
        fakePrefs.get.withArgs("migrationLastShownDate").returns(yesterday.valueOf() / 1000);
        fakePrefs.get.withArgs("migrationRemainingDays").returns(1);
        const ret = instance.isMigrationMessageExpired();

        assert.calledOnce(migrationSpy);
        assert.calledTwice(fakePrefs.set);
        assert.calledWithExactly(fakePrefs.set, "migrationRemainingDays", 0);
        assert.equal(ret, true);
      });
    });
  });
  it("should have observe as a proxy for setMigrationStatus", () => {
    const setStatusStub = sinon.stub(instance, "expireMigration");
    instance.observe();

    assert.calledOnce(setStatusStub);
  });
  it("should remove observer at uninit", () => {
    const uninitSpy = sinon.spy(instance, "uninit");
    const action = {type: at.UNINIT};

    instance.onAction(action);

    assert.calledOnce(uninitSpy);
    assert.calledOnce(fakeServices.obs.removeObserver);
    assert.calledWith(fakeServices.obs.removeObserver, instance, "Migration:Ended");
  });
});
