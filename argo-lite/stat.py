import pandas as pd
import csv


familyID = []
selectNode = []

# data = pd.read_csv('argo-lite/MafiaNodes_2.csv')
# # Filter the data accordingly.
# data = data[data['Family'] == 'Genovese']
# # data = data[data['OS'] == 'Mac']
# data.to_csv('argo-lite/Genovese Node.csv')

with open('argo-lite/MafiaNodes_2.csv') as f:
    a = [{k: v for k, v in row.items()}
        for row in csv.DictReader(f, skipinitialspace=True)]
for aa in a:
    if aa['Family'] == 'Genovese':
        aa['LonX'] = float(aa['LonX'])
        aa['LatY'] = float(aa['LatY'])
        selectNode.append(aa)
        familyID.append(aa['ID'])

keys = selectNode[0].keys()
with open('argo-lite/Genovese Node.csv', 'w', newline='') as output_file0:
    dict_writer = csv.DictWriter(output_file0, keys)
    dict_writer.writeheader()
    dict_writer.writerows(selectNode)

# print(familyID)

selectEdge = []
with open('argo-lite/MafiaEdges_2.csv') as f:
    b = [{k: v for k, v in row.items()}
        for row in csv.DictReader(f, skipinitialspace=True)]
for bb in b:
    if (bb['Target'] in familyID) or (bb['Source'] in familyID):
        selectEdge.append(bb)

keys = selectEdge[0].keys()

with open('argo-lite/Genovese Edge.csv', 'w', newline='') as output_file:
    dict_writer = csv.DictWriter(output_file, keys)
    dict_writer.writeheader()
    dict_writer.writerows(selectEdge)



