angular.module('sphericalApp.DataContainerServices', [])
    .service('ActivityVis', [function() {
        return {
            stories: true,
            discussions: false,
            discussion_edit: false,
            show_drag_target: false,
            swipe_enable: true,
            thispost_disabled: false
        };
    }])
    .service('ForumData', [function() {
        return {};
    }])
    .service('ChooserData', [function() {
        return {
            active_slide: 0,
            active_discussion: 0,
            citations: []
        };
    }]);
