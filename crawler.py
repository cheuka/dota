"""
This is a sample crawler done by lordstone


"""

import urllib
import re
import time


import const



def getHtml(url):
    page = urllib.urlopen(url)
    html = page.read()
    return html


def test_getHtml():
    html = getHtml(const.URL_DOTAMAX_TOUR)
    print html


def proc_league(myurl):
    """
    process each url
    :param myurl:
    :return:
    """
    print 'processing:', const.URL_DOTAMAX_PREFIX + myurl
    print 'league name:',


def get_entry(content='', myfunc=None):
    """
    To crawl all leagues
    :param content:
    :return:
    """
    reg = r'/match/tour_league_overview/\?league_id=[0-9]{1,6}'
    league_re = re.compile(reg)
    league_list = re.findall(league_re, content)
    x = 0
    for league_url in league_list:
        # print league_url
        # urllib.urlretrieve(league_url, '%s.html' % x)
        if myfunc:
            myfunc(league_url)
        x += 1
    print 'You have found', x, 'leagues pages in this directory'


"""
print 'test html'
test_getHtml()
"""


def main():
    html = getHtml(const.URL_DOTAMAX_TOUR)
    get_entry(html, proc_league)

# start from here as the main driver
main()

