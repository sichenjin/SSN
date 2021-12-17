import pandas as pd
import csv

dfs = pd.read_excel('./data/Network data for GIS.xlsx', sheet_name=None)
dfs1 = dfs['Information Sharing Confirmed'].to_numpy()
head = dfs['Information Sharing Confirmed']['Map Name (Code)'].tolist()
print(head)
dic = []
for i in range(0, 105):
    for j in range(i, 105):
        if dfs1[i,j+1] == 1:
            dic.append({
                'source':head[i],
                'target': head[j]
            })
            

keys = dic[0].keys()

with open('foodlink.csv', 'w', newline='') as output_file:
    dict_writer = csv.DictWriter(output_file, keys)
    dict_writer.writeheader()
    dict_writer.writerows(dic)