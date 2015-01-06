angular.module('sphericalApp.DataContainerServices', [])
    .service('ActivityVis', [function() {
        return {
            stories: true,
            discussions: false,
            discussion_edit: false,
            discussions_active: false,
            stories_active: true,
            show_drag_target: false,
            swipe_enable: true,
            thispost_disabled: false,
            shareitem: false,
            activity_window: 'stories',
            unshareable: false,
            overlay: null
        };
    }])
    .service('ForumData', [function() {
        return {
          forum_ctx_id: '',
          form_visible: false
        };
    }])
    .service('ChooserData', [function() {
        return {
            active_slide: 0,
            active_discussion: 0,
            thispostdata: {
              citations: []
            }
        };
    }]);
