from app import utils

import bottle
from google.appengine.ext.webapp import util

import atom, paginator

from app import template, config, models

if config.DEBUG:
    bottle.debug(True)

@bottle.route('/')
def index():
    runaways_page = paginator.Paginator(models.Runaway.all_approved(), 10)\
                                .page(bottle.request.GET.get('page', 1))
    count = models.Runaway.all_approved().count()

    return template.render('index.html', {
        'runaways_page': runaways_page, 'runaways_count': count,
        'notify': 'notify' in bottle.request.GET
    })

@bottle.route('/:id#\d+#/')
def runaway(id):
    obj = models.Runaway.get_by_id(int(id))
    if obj is None or not obj.is_approved:
        raise bottle.HTTPError(404, 'Runaway not found')

    return template.render('runaway.html', {'runaway': obj})

@bottle.route('/feed/')
def feed():
    bottle.response.set_content_type('application/atom+xml')

    feed_builder = atom.AtomFeed(
        'awayfromflash: recent runaways', feed_url='/runaways/feeds/latest/',
        url='http://www.awayfromflash.com/',
        subtitle='List of Adobe Flash runaways'
    )

    for runaway in models.Runaway.all_approved().fetch(30):
        feed_builder.add(
            runaway.title,
            runaway.text,
            content_type='plain',
            author='www.awayfromflash.com',
            url='/%s/' % runaway.key().id(),
            updated=runaway.date,
            published=runaway.date,
        )
    return feed_builder.to_string()

@bottle.route('/add/', method=['GET', 'POST'])
def add():
    errors = []

    if bottle.request.POST:
        data = bottle.request.POST

        required = ('title', 'url', 'proof_link')

        for field in required:
            if not data.get(field):
                errors.append('%s - is required' % field.replace('_', ' '))

        if not errors:
            obj = models.Runaway(
                title=data['title'],
                url=data['url'],
                proof_link=data['proof_link'],
                quote=data['quote'],
                text=data['text']
            )
            obj.put()

            bottle.redirect('/?notify')
    else:
        data = {}
    return template.render('add.html', {'data': data, 'errors': errors})


def main():
    util.run_wsgi_app(bottle.default_app())

if __name__ == '__main__':
    main()
