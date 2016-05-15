import string
import urllib
from lxml import etree


def getHtml(url):
    """
    :param url:
    :return:
    """
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
