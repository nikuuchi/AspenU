import os
import yaml
import codecs

def load():
    path = os.path.abspath(os.path.dirname(__file__))
    conf = yaml.load(codecs.open(path + "/default.yaml"))
    if os.path.exists(path + "/development.yaml"):
        conf.update(yaml.load(codecs.open(path + "/development.yaml")))
    return conf