#-*-coding:utf8-*-


"""
This is a sample crawler done by lordstone


"""
import string
import urllib
import re
import time
from lxml import etree


import const


def getHtml(url):
    page = urllib.urlopen(url)
    html = page.read()
    return html


def get_from_etree(mytree, attrib):
    """
    This is the function to get content from etree
    :param mytree:
    :param attrib:
    :return:
    """
    contents = mytree.xpath("//" + attrib)
    return contents


def proc_league(myurl):
    """
    process each url
    :param myurl:
    :return:
    """
    this_url = const.URL_DOTAMAX_PREFIX + myurl
    print 'processing:', this_url
    html = getHtml(this_url)
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


def main():
    """
    Driver function
    """
    html = getHtml(const.URL_DOTAMAX_TOUR)
    get_entry(html, proc_league)

# start from here as the main driver
main()

