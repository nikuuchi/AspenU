import flask
app = flask.Flask(__name__)

@app.route("/")
def teaser_site():
    return "Hello World!"

@app.route("/edit")
def edit():
    return flask.render_template("edit.html")

@app.route("/user")
def user_info():
    return flask.render_template("user.html")

@app.route("/admin")
def admin_info():
    return flask.render_template("admin.html")

@app.route("/login", methods=["POST"])
def post_login():
    pass

@app.route("/compile", methods=["POST"])
def compile():
    pass

@app.errorhandler(404)
def page_not_found(error):
    return flask.render_template("page_not_found.html"), 404

if __name__ == "__main__":
    app.secret_key = 'YOU ADD YOUR SECRET KEY'
    app.run(debug=True)
