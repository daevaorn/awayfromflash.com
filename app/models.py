from datetime import datetime

from google.appengine.ext import db

class Runaway(db.Model):
    title = db.StringProperty(required=True)
    url = db.LinkProperty(required=True)

    date = db.DateTimeProperty(auto_now_add=True)

    proof_link = db.LinkProperty(required=True)
    text = db.TextProperty()
    quote = db.TextProperty()

    is_approved = db.BooleanProperty(default=False)

    @classmethod
    def all_approved(cls):
        return cls.all().filter('is_approved = ', True).order('-date')
