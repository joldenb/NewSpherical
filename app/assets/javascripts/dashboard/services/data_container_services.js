angular.module('sphericalApp.DataContainerServices', [])
    .service('ActivityVis', [function() {
        return {
            stories: true,
            discussions: false,
            discussion_edit: false
        };
    }])
    .service('ForumData', [function() {
        return {};
    }]);