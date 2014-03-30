import os
import yaml
import codecs

DEFAULT_CONFIG_FILE = '/default.yaml'
DEVELOPMENT_CONFIG_FILE = '/development.yaml'
PRODUCTION_CONFIG_FILE = '/production.yaml'

def load():
    path = os.path.abspath(os.path.dirname(__file__))
    conf = yaml.load(codecs.open(path + DEFAULT_CONFIG_FILE))
    if os.path.exists(path + DEVELOPMENT_CONFIG_FILE):
        conf.update(yaml.load(codecs.open(path + DEVELOPMENT_CONFIG_FILE)))
    return conf