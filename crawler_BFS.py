#-*-coding:utf8-*-
import const
from utility import *
import os


def get_entries(html, proc_league=None):
    pass


def proc_league():
    pass


def proc_league_list():
    pass


def gen_league_list():
    code, html = getHtml(const.URL_DOTAMAX_TOUR)
    status = code // 100
    if status == 2 or status == 3:
        get_entries(html, proc_league)
    else:
        print 'bad url link, program terminating...'


def main():
    """
    Driver function
    """
    if os.path.exists('saved_data/league_list.txt'):
        proc_league_list()
    else:
        gen_league_list()


# start from here as the main driver
main()
