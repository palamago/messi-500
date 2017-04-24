import sys
reload(sys)
import urllib
import hashlib
import io
import os.path
import datetime
import time
import csv
import glob
import random
from bs4 import BeautifulSoup
from shutil import copyfile
from collections import deque

sys.setdefaultencoding('utf8')

goals_file = "app/data/messi-500-goals.csv"
games_file = "app/data/messi-500-matches.csv"

#def get_last_row():
#	global csv_file 
#	with open(csv_file, 'r') as f:
#		try:
#			lastrow = deque(csv.reader(f), 1)[0]
#		except IndexError:  # empty file
#			lastrow = None
#		return lastrow

def convert_date(date):
	parts = date.split('-')
	return parts[2]+'-'+parts[1]+'-'+parts[0]

def get_team(home,away):
	if home=='Argentina' or home=='FC Barcelona':
		return home
	else:
		return away

#### SCRAPE
def getGoals():
	html_doc = urllib.urlopen('https://messi.starplayerstats.com/en/goals/0/0/all/0/0/0/0/all/all/0/0/1').read()
	soup = BeautifulSoup(html_doc.decode('utf-8'), 'html.parser')

	all_goals = soup.find("section", class_="results").find("tbody").find_all("tr")

	result = [
	['id','date','competition','home','away','result','minute','score','what','how','jersey']
	]

	for item in reversed(all_goals):
		params = item.find_all('td')
		result.append([
			params[0].get_text(), #id
			convert_date(params[1].get_text()), #date
			params[2].find('span').get_text(), #competition
			params[3].get_text(), #home
			params[5].get_text(), #away
			params[4].get_text(), #result
			params[6].get_text(), #minute
			params[7].get_text(), #score
			params[8].get_text(), #what
			params[9].get_text(), #how
			params[10].get_text(), #jersey
		])

	return result

def getGames():
	html_doc = urllib.urlopen('https://messi.starplayerstats.com/en/games/0/0/all/0/0/0/0/0/0/1').read()
	soup = BeautifulSoup(html_doc.decode('utf-8'), 'html.parser')

	all_goals = soup.find("section", class_="results").find("tbody").find_all("tr")

	result = [
	['id','date','competition','home','away','team','home_goals','away_goals','lineup','minutes','goals','assists','cards','minutes_acum','goals_acum','assists_acum','jersey']
	]

	m_acum = 0
	g_acum = 0
	a_acum = 0
	for item in reversed(all_goals):
		params = item.find_all('td')
		m_acum += int(params[7].get_text())
		g_acum += int(params[8].get_text())
		a_acum += int(params[9].get_text())
		result.append([
			params[0].get_text(), #id
			convert_date(params[1].get_text()), #date
			params[2].find('span').get_text(), #competition
			params[3].get_text(), #home
			params[5].get_text(), #away
			get_team(params[3].get_text(),params[5].get_text()), #team
			params[4].get_text().split('-')[0], #home_goals
			params[4].get_text().split('-')[1], #away_goals
			params[6].find('span').get_text(), #lineup
			params[7].get_text(), #minutes
			params[8].get_text(), #goals
			params[9].get_text(), #assists
			params[10].get_text(), #cards
			m_acum,
			g_acum,
			a_acum,
			params[11].get_text() #jersey

		])

	return result

def saveCSV(csv_file,rows):

	with open(csv_file,'w+') as f:
		writer=csv.writer(f)
		writer.writerows(rows)

###RUN! 
saveCSV(goals_file,getGoals())
saveCSV(games_file,getGames())



sys.exit()