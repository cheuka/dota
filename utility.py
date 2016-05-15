import string
import urllib
from lxml import etree


def getHtml(url):
    """
    This is the basic html get function
    :param url:
    :return:
    """
    page = urllib.urlopen(url)
    code = page.getcode()
    # print 'code:', code
    html = page.read()
    return code, html


def get_from_etree(mytree, attrib):
    """
    This is the function to get content from etree
    :param mytree:
    :param attrib:
    :return:
    """
    contents = mytree.xpath("//" + attrib)
    return contents


def print_and_write(content='', fp=None):
    """
    This is the print and write
    :param content:
    :param fp:
    :return:
    """
    if content != '':
        print content
        if fp:
            if isinstance(fp, file) and fp.mode == 'a+':
                fp.write(content + '\n')
