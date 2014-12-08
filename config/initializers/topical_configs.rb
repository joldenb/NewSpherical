R88R = {
  :base => 'http://v3.api.r88r.net',
  :topics => {
    :climate => '/v3/headlines?cname=PCT.V3.mod.environment.climate',
    :biodiversity => '/v3/headlines?cname=PCT.V3.mod.environment.biodiversity',
    :clean_tech => '/v3/headlines?cname=PCT.V3.mod.tech.cleantech',
    :oceans => '/v3/headlines?cname=PCT.V3.mod.environment.oceans',
    :biomimicry => '/v3/headlines?cname=PCT.V3.mod.design.biomimicry',
    :social_enterprise => '/v3/headlines?cname=PCT.V3.mod.business.socialenterprise',
    #:social_change => '/v3/headlines?cname=PCT.V3.mod.society.socialchange',
    :consumption => '/v3/headlines?cname=PCT.V3.mod.living.consumption',
    :electric_vehicles => '/v3/headlines?cname=PCT.V3.mod.cities.ev',
    :resilience => '/v3/headlines?cname=PCT.V3.mod.environment.resilience',
    :energy => '/v3/headlines?cname=PCT.V3.mod.environment.energy',
    :nature => '/v3/headlines?cname=PCT.V3.mod.environment.nature',
    :agriculture => '/v3/headlines?cname=PCT.V3.mod.environment.agriculture'#,
    #:hundred_pct_top_stories => '/v3/headlines?cname=PCT.V3.mod.top_stories'
  }
}

LinkTV = {
    :base => 'http://www.linktv.org/',
    :topics => {
        :earth_focus => 'rss/general/earth.xml'
    }
}

YesMagazine = {
    :base => 'http://feeds.feedburner.com/',
    :topics => {
        :planet => 'yes/planet',
        :new_economy => 'yes/new-economy',
        :people_power => 'yes/people-power',
        :peace_justice => 'yes/peace-justice',
        :happiness => 'yes/happiness'
    }
}

ItemTypes = %w{r88r linktv topical spherical yesmag curator discussion}
StoryTypes = %w{r88r linktv topical spherical yesmag}

EntityCarouselPerPage = 16
CarouselPerPage = 6
CarouselInitialPages = 3

ContextRootIdentifier = "planetwork"

RecommendedItemChars = 600
