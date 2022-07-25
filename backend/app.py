from flask import Flask, send_from_directory
from flask_restful import Api, Resource, reqparse
# from flask_cors import CORS #comment this on deployment
from api.HelloApiHandler import HelloApiHandler
from api.Community import Community
from api.Cliques import Cliques
from api.MyConvexHull import MyConvexHull

app = Flask(__name__, static_url_path='', static_folder='frontend/build')
# CORS(app) #comment this on deployment
api = Api(app)

@app.route("/", defaults={'path':'/flask/hello'})
def serve(path):
    return send_from_directory(app.static_folder,'index.html')

api.add_resource(HelloApiHandler, '/flask/hello')

api.add_resource(Community, '/flask/community')
api.add_resource(Cliques, '/flask/Cliques')
api.add_resource(MyConvexHull, '/flask/convexhull')

if __name__=='__main__':
  app.run(debug=True)