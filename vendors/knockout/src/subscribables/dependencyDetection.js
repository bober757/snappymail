
ko.computedContext = ko.dependencyDetection = (() => {
    var outerFrames = [],
        currentFrame,
        lastId = 0;

    function begin(options) {
        outerFrames.push(currentFrame);
        currentFrame = options;
    }

    function end() {
        currentFrame = outerFrames.pop();
    }

    return {
        begin: begin,

        end: end,

        registerDependency: subscribable => {
            if (currentFrame) {
                if (!ko.isSubscribable(subscribable))
                    throw new Error("Only subscribable things can act as dependencies");
                currentFrame.callback.call(currentFrame.callbackTarget, subscribable, subscribable._id || (subscribable._id = ++lastId));
            }
        },

        ignore: (callback, callbackTarget, callbackArgs) => {
            try {
                begin();
                return callback.apply(callbackTarget, callbackArgs || []);
            } finally {
                end();
            }
        },

        getDependenciesCount: () => {
            if (currentFrame)
                return currentFrame.computed.getDependenciesCount();
        },

        getDependencies: () => {
            if (currentFrame)
                return currentFrame.computed.getDependencies();
        },

        isInitial: () => {
            if (currentFrame)
                return currentFrame.isInitial;
        },

        computed: () => {
            if (currentFrame)
                return currentFrame.computed;
        }
    };
})();

ko.exportSymbol('computedContext', ko.computedContext);
ko.exportSymbol('computedContext.getDependenciesCount', ko.computedContext.getDependenciesCount);
ko.exportSymbol('computedContext.getDependencies', ko.computedContext.getDependencies);
ko.exportSymbol('computedContext.isInitial', ko.computedContext.isInitial);
ko.exportSymbol('computedContext.registerDependency', ko.computedContext.registerDependency);

ko.exportSymbol('ignoreDependencies', ko.ignoreDependencies = ko.dependencyDetection.ignore);
