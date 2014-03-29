# -*- coding: utf-8 -*-

import os
import commands
import codecs
import json
import tempfile

def create_response_json(source, result, error):
    return json.dumps({'source': source, 'result': result, 'error': error})

def create_source_file(name, contents):
    f = codecs.open(name, 'w', 'utf-8')
    f.write(contents)
    f.close()

def compile_command(name, compile_path):
    command = '{0}/emcc  -O1 -W -Wall -Qunused-arguments {1} -o {1}.js'.format(compile_path, name)
    return commands.getoutput(command)

def read_compiled_file(name):
    if os.path.exists(name+".js"):
        a = open(name+'.js', 'r')
        return a.read()
    return ''

def compile_server(req, config):
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.c', dir='/tmp')
    name = temp_file.name
    temp_file.close() #tempfile cannot use utf-8 in python 2.7, so need to reopen

    create_source_file(name, req["source"])
    message = compile_command(name, config["compile_path"])

    file_content = read_compiled_file(name)
    return create_response_json(file_content, '', message)
