describe('E2E: main dashboardpage', function() {
    var ptor;

    beforeEach(function() {
        browser.get('http://127.0.0.1:3000/');
        ptor = protractor.getInstance();
    });

    it('should load the dashboard', function() {
        var container = by.id('topical_dashboard_container'),
        content = by.id('dashboard_content');
        expect(ptor.isElementPresent(container)).toBe(true);
        expect(ptor.isElementPresent(content)).toBe(true);
    });

});