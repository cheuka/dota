"""
This is a sample crawler done by lordstone


"""

import urllib
import re

import const



def getHtml(url):
    page = urllib.urlopen(url)
    html = page.read()
    return html


def test_getHtml():
    html = getHtml(const.URL_DOTAMAX_TOUR)
    print html


print 'test html'
test_getHtml()
