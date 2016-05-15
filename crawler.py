#-*-coding:utf8-*-

"""
This is a sample crawler done by lordstone
"""

import re
import time
import const
from utility import *


def proc_match(match_id):
    """
    match level proc
    :param match_id:
    :return:
    """
    pass



def proc_league(myurl, proc_match=None):
    """
    league level proc
    :param myurl:
    :return:
    """
    this_url = const.URL_DOTAMAX_PREFIX + myurl

    print 'processing:', this_url
    code, html = getHtml(this_url)
    status = code // 100
    if not (status == 2 or status == 3):
        print 'Bad sublink, going to the next url...'
        return
    html = html.replace('\n', ' ')
    html = html.replace('\t', ' ')
    html_tree = etree.HTML(html.decode('utf-8'))
    # Getting its title
    mytitle_list = get_from_etree(html_tree, 'title')
    if mytitle_list:
        title_string = mytitle_list[0].text
        title_string = title_string.replace('<title>', ' ')
        title_string = title_string.replace('</title>', ' ')
        title_string = title_string.replace(u'-  Dotamax - 做国内第一游戏数据门户', ' ')
        title_string = title_string.replace('\n', ' ')
        title_string = title_string.strip()
        print 'league name:', title_string
    match_regex = r'/match/detail/[0-9]{9,11}'
    match_re = re.compile(match_regex)
    match_list = re.findall(match_re, html)
    match_set = set(match_list)
    print 'You found', len(match_set), 'matches in this league'
    for i in match_set:
        # print const.URL_DOTAMAX_PREFIX + i
        if proc_match:
            proc_match(const.URL_DOTAMAX_PREFIX + i)


def get_entry(content='', myfunc=None):
    """
    To crawl all leagues
    :param content:
    :return:
    """
    reg = r'\?league_id=[0-9]{1,6}'
    league_re = re.compile(reg)
    league_list = re.findall(league_re, content)
    league_set = set(league_list)
    x = 0
    for league_id in league_set:
        # print league_url
        # urllib.urlretrieve(league_url, '%s.html' % x)
        if myfunc:
            myfunc('/match/tour_matches/'+league_id)
        x += 1
    print 'You have found', x, 'leagues pages in this directory'


def main():
    """
    Driver function
    """
    code, html = getHtml(const.URL_DOTAMAX_TOUR)
    status = code // 100
    if status == 2 or status == 3:
        get_entry(html, proc_league)
    else:
        print 'bad url link, program terminating...'

# start from here as the main driver
main()

