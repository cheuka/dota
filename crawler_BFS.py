#-*-coding:utf8-*-
import const
from utility import *
import os
import re


def get_entries(content):
    reg = r'\?league_id=[0-9]{1,6}'
    league_re = re.compile(reg)
    league_list = re.findall(league_re, content)
    league_set = set(league_list)
    x = 0
    fp = open('saved_data/leagues_list.txt', 'w+')
    for league_id in league_set:
        fp.write('http://www.dotamax.com/match/tour_matches/'+league_id+'\n')
        x += 1
    print 'You have found', x, 'leagues pages in this directory. Wrote to "saved_data/leagues_list.txt'
    fp.close()


def proc_league():
    pass


def proc_league_list():
    pass


def gen_league_list():
    code, html = getHtml(const.URL_DOTAMAX_TOUR)
    status = code // 100
    if status == 2 or status == 3:
        get_entries(html)
    else:
        print 'bad url link, program terminating...'


def main():
    """
    Driver function
    """
    if not os.path.exists('saved_data/leagues_list.txt'):
        gen_league_list()
    proc_league_list()


# start from here as the main driver
main()
