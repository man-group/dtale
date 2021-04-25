from flask import redirect, render_template, request, session, url_for
from functools import wraps

import dtale.global_state as global_state


def setup_auth(app):
    if not global_state.get_auth_settings()["active"]:
        return

    @app.route("/login", methods=["GET", "POST"])
    def login():
        if request.method == "POST":
            username, password = (request.form.get(p) for p in ["username", "password"])
            if not authenticate(username, password):
                return render_template(
                    "dtale/login.html", error="Invalid credentials!", page="login"
                )
            session["logged_in"] = True
            session["username"] = request.form["username"]
            return redirect(session.get("next") or "/")
        return render_template("dtale/login.html", page="login")

    @app.route("/logout")
    def logout():
        session.clear()
        return redirect(url_for("login"))


def authenticate(username, password):
    auth_settings = global_state.get_auth_settings()
    if username == auth_settings["username"] and password == auth_settings["password"]:
        return True
    return False


def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not global_state.get_auth_settings()["active"]:
            return f(*args, **kwargs)
        if request.path in ["/login", "/logout"]:
            return f(*args, **kwargs)
        if request.path.startswith("/dtale/static"):
            return f(*args, **kwargs)
        if not session.get("logged_in") or not session.get("username"):
            session["next"] = request.url
            return redirect(url_for("login"))
        return f(*args, **kwargs)

    return decorated
