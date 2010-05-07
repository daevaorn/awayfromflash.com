import os

DEBUG = os.environ.get('SERVER_SOFTWARE', 'Development').startswith('Development')

TEMPLATE_DIRS = [
    'templates'
]

MEDIA_URL = '/media/'
