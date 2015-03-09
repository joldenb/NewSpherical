json.related do
    json.array! @relateds do |related|
        json.id related.id.to_s
        json.name related.display_identifier
        json.pic @related_imgs[related.id.to_s]
        json.itemtype 'related'
    end
end
