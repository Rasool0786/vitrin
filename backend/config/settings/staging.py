from .production import *  # noqa: F401,F403

LOGGING["loggers"]["django.db.backends"]["level"] = "DEBUG"

DEFAULT_FROM_EMAIL = "staging@vitrin.ir"
