R88R = {
  :base => 'http://pct.api.r88r.net/',
  :topics => {
    :climate => 'headlines/v1/json/PCT.mod.environment.climate/',
    :biodiversity => 'headlines/v1/json/PCT.mod.environment.biodiversity/',
    :clean_tech => 'headlines/v1/json/PCT.mod.tech.cleantech/',
    :oceans => '/headlines/v1/json/PCT.mod.environment.oceans/',
    :biomimicry => '/headlines/v1/json/PCT.mod.design.biomimicry/',
    :social_enterprise => '/headlines/v1/json/PCT.mod.business.socialenterprise/',
    :social_change => '/headlines/v1/json/PCT.mod.society.socialchange/',
    :consumption => '/headlines/v1/json/PCT.mod.living.consumption/',
    :electric_vehicles => '/headlines/v1/json/PCT.mod.cities.ev/',
    :resilience => '/headlines/v1/json/PCT.mod.environment.resilience/',
    :energy => '/headlines/v1/json/PCT.mod.environment.energy/',
    :nature => '/headlines/v1/json/PCT.mod.environment.nature/',
    :agriculture => '/headlines/v1/json/PCT.mod.environment.agriculture/',
    :hundred_pct_top_stories => '/headlines/v1/json/PCT.mod.top_stories/'
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

ItemTypes = %w{r88r linktv topical yesmag curator discussion}
StoryTypes = %w{r88r linktv topical yesmag}

EntityCarouselPerPage = 16
CarouselPerPage = 6
CarouselInitialPages = 3

ContextRootIdentifier = "planetwork"

RecommendedItemChars = 600
