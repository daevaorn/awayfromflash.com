import os

import bottle
from jinja2 import Environment, FileSystemLoader, TemplateNotFound

from app import config

root = os.path.dirname(os.path.dirname(__file__))

template_dirs = [
    os.path.join(root, template_dir)\
        for template_dir in config.TEMPLATE_DIRS
]

env = Environment(loader=FileSystemLoader(template_dirs))

def render(template_name, context):
    try:
        template = env.get_template(template_name)
    except TemplateNotFound:
        raise TemplateNotFound(template_name)

    defaults = {
        'request': bottle.request,
        'MEDIA_URL': config.MEDIA_URL,
        'DEBUG': config.DEBUG,
    }
    defaults.update(context)
    return template.render(defaults)
