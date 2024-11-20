from flask_restful import Api, Resource, reqparse
from flask import Flask, jsonify, request
import networkx as nx
import pandas as pd
import community 

class Cliques(Resource):
  def get(self):
    return {
      'resultStatus': 'SUCCESS',
      'message': "Hello Clique Handler"
      }

  def post(self):
    print(self)
    parser = reqparse.RequestParser()
    parser.add_argument('type', type=str)
    parser.add_argument('message', type=str)
    parser.add_argument('fromedgelist',type=str, action='append')
    parser.add_argument('toedgelist',type=str, action='append')

    args = parser.parse_args()

    # print(args)
    
    # note, the post req from frontend needs to match the strings here (e.g. 'type and 'message')

    request_type = args['type']
    request_json = args['message']
    fromedgelist = args['fromedgelist']
    toedgelist = args['toedgelist']
    edgelist =  [(fromedgelist[i], toedgelist[i]) for i in range(0, len(toedgelist))]

    # print(edgelist)
    # ret_status, ret_msg = ReturnData(request_type, request_json)
    # currently just returning the req straight
    ret_status = request_type
    ret_msg = request_json

    # if ret_msg:
    #   message = "Your Message Requested: {}".format(ret_msg)
    # else:
    #   message = "No Msg"

    G = nx.Graph(edgelist) 
    # cliques = nx.find_cliques(G)
    for clique in  nx.find_cliques(G):
      print(clique)
    
    final_ret = 0
    # {"status": "Success", "message": cliques }

    return final_ret