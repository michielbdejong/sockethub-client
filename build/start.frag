(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.SockethubClient = factory();
    }
}(this, function () {
