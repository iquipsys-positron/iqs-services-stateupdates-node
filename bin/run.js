let StateUpdatesProcess = require('../obj/src/container/StateUpdatesProcess').StateUpdatesProcess;

try {
    new StateUpdatesProcess().run(process.argv);
} catch (ex) {
    console.error(ex);
}
