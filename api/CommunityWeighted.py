from flask_restful import Resource, reqparse
from flask import jsonify
import networkx as nx
import pandas as pd
import community  # python-louvain
from collections import defaultdict

class CommunityWeighted(Resource):
    def get(self):
        return {
            'resultStatus': 'SUCCESS',
            'message': "Hello Weighted Community Handler"
        }

    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('type', type=str)
        parser.add_argument('message', type=str)
        parser.add_argument('fromedgelist', type=str, action='append')
        parser.add_argument('toedgelist', type=str, action='append')
        parser.add_argument('weightlist', type=float, action='append')  # <— new

        args = parser.parse_args()

        fromedgelist = args['fromedgelist']
        toedgelist = args['toedgelist']
        weightlist = args['weightlist']

        # Create weighted edge tuples
        weighted_edges = [
            (fromedgelist[i], toedgelist[i], weightlist[i])
            for i in range(len(toedgelist))
        ]

        # Create weighted graph
        G = nx.Graph()
        G.add_weighted_edges_from(weighted_edges)

        # Run Louvain method with weights
        partition = community.best_partition(G, weight='weight')
        modularity = community.modularity(partition, G, weight='weight')

        final_ret = {
            "status": "Success",
            "message": partition,
            "modularity": modularity
        }

        return jsonify(final_ret)
