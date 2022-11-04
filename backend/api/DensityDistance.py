from ast import arg
from re import I
from flask_restful import Api, Resource, reqparse
from flask import Flask, jsonify, request
import networkx as nx
import pandas as pd
import community 
from scipy.spatial import ConvexHull, convex_hull_plot_2d
from scipy.spatial.distance import pdist
# from geopy.distance import vincenty
import sys, math
import numpy as np
import json
import ast
from scipy import stats


class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)

class DensityDistance(Resource):
  def get(self):
    return {
      'resultStatus': 'SUCCESS',
      'message': "Hello density distance"
      }

  def post(self):
    print(self)
    parser = reqparse.RequestParser()
    parser.add_argument('type', type=str)
    parser.add_argument('message', type=str)
    parser.add_argument('group',type=str)
    parser.add_argument('nodes',type=str, action='append')
    parser.add_argument('edges',type=str, action='append')
    

    args = parser.parse_args()

    # print(args)
    
    # note, the post req from frontend needs to match the strings here (e.g. 'type and 'message')

    request_type = args['type']
    request_json = args['message']
    nodes = [ast.literal_eval(n) for n in args['nodes']]
    groupby = args['group']
    edges = [ast.literal_eval(n) for n in args['edges']]

    
    group_names =  set([n[groupby] for n in nodes])
    # convex_dict = {}
    density_distance  = []
    for group_name in group_names:
      groupnodes = [n for n in nodes if n[groupby] == group_name]
      groupnodeid =  [n['id'] for n in nodes if n[groupby] == group_name]
      glat = [n["LatY"] for n in groupnodes]
      glon = [n["LonX"] for n in groupnodes]
      points = np.array(list(zip(glat, glon)))

      #calculater the standard distance
      avg_x, avg_y = np.mean(points, axis=0)

      sum_of_sq_diff_x = 0.0
      sum_of_sq_diff_y = 0.0

      for x, y in points:
          diff_x = math.pow(x - avg_x, 2)
          diff_y = math.pow(y - avg_y, 2)
          sum_of_sq_diff_x += diff_x
          sum_of_sq_diff_y += diff_y

      sum_of_results = (sum_of_sq_diff_x/points.shape[0]) + (sum_of_sq_diff_y/points.shape[0])
      standard_distance = math.sqrt(sum_of_results) *100
      
      #calculate the network density 
      subedgelistdict = [edge for edge in edges if (edge["source_id"] in groupnodeid or edge['target_id'] in groupnodeid) ]
      subedgelist = [(edge["source_id"], edge['target_id']) for edge in subedgelistdict]
      subG = nx.Graph(subedgelist) 
      # print(nx.is_directed(subG))
      subdensity = nx.density(subG)

      # the size of the family 
      subsize = len(groupnodeid)
      density_distance.append({
        "size":subsize,
        "name":group_name,
        "network density": subdensity,
        "standard distance": standard_distance
      })


    # print ("Standard Distance: {0}". format(standard_distance))
    print(density_distance)
    final_ret = json.dumps({"status": "Success", "density_distance" : density_distance }, 
                       cls=NumpyEncoder)

    return final_ret