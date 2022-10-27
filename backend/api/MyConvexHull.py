from ast import arg
from re import I
from flask_restful import Api, Resource, reqparse
from flask import Flask, jsonify, request
import networkx as nx
import pandas as pd
import community 
from scipy.spatial import ConvexHull, convex_hull_plot_2d
import numpy as np
import json
import ast
from scipy import stats


class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)

class MyConvexHull(Resource):
  def get(self):
    return {
      'resultStatus': 'SUCCESS',
      'message': "Hello Community Handler"
      }

  def post(self):
    print(self)
    parser = reqparse.RequestParser()
    parser.add_argument('type', type=str)
    parser.add_argument('message', type=str)
    parser.add_argument('nodes',type=str, action='append')
    parser.add_argument('group',type=str)

    args = parser.parse_args()

    # print(args)
    
    # note, the post req from frontend needs to match the strings here (e.g. 'type and 'message')

    request_type = args['type']
    request_json = args['message']
    nodes = [ast.literal_eval(n) for n in args['nodes']]
    groupby = args['group']
    group_names =  set([n[groupby] for n in nodes])
    convex_dict = {}
    multiPolygon  = []
    for group_name in group_names:
      groupnodes = [n for n in nodes if n[groupby] == group_name]
      if len(groupnodes) < 3: 
        continue
      glat = [n["LatY"] for n in groupnodes]
      glon = [n["LonX"] for n in groupnodes]
      points = np.array(list(zip(glat, glon)))

      #remove outlier
      gdf = pd.DataFrame(points, columns = ['glat','glon'])
      ngdf = gdf[(np.abs(stats.zscore(gdf)) < 3).all(axis=1)]
      points = ngdf.to_numpy()
      
      hull = ConvexHull(points)
      # Get the indices of the hull points.
      hull_indices = hull.vertices
      multiPolygon.append({
        "community": group_name,
        "points":list(points[hull.vertices,:])
      })

      # These are the actual points.
      hull_node_id = {groupnodes[i]['id'] : 1 for i in hull_indices }
      none_hull_node_id =  {groupnodes[i]['id'] : 0 for i in range(len(groupnodes)) if i not in hull_indices }
      z = {**hull_node_id, **none_hull_node_id}
      print(z)
      convex_dict = {**z, **convex_dict}

    
    final_ret = json.dumps({"status": "Success", "message": convex_dict , "multipolygon" : multiPolygon }, 
                       cls=NumpyEncoder)

    return final_ret