from prices import create_app


if __name__ == "__main__":
    app, connection = create_app()
    app.run(port=3005)
