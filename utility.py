import string
import urllib2
from lxml import etree
import re
import socket
import const
import requests
import HTMLParser


socket.setdefaulttimeout(20.0)


def get_html(url, header=True):
    """
    This is the basic html get function
    :param url:
    :return:
    """
    if header:
        url2 = urllib2.Request(url, None, const.URL_HEADER)
    else:
        url2 = urllib2.Request(url)
    try:
        page = urllib2.urlopen(url2)
        code = page.getcode()
        # print 'code:', code
        html = page.read()
        return code, html
    except urllib2.HTTPError, e:
        print 'HTML Get Error Code:', e.code, ',Reason:', e.reason
        return e.code, e.reason


def get_from_etree(mytree, attrib):
    """
    This is the function to get content from etree
    :param mytree:
    :param attrib:
    :return:
    """
    contents = mytree.xpath("//" + attrib)
    return contents


def get_from_parser():
    pass


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


def check_url_format(content):
    res = re.match(r'^(?:http|ftp)s?://.*', content)
    return res


def clear_illegal_chars(content):
    rstr = r"[\/\\\:\*\?\"\<\>\|]"  # '/\:*?"<>|'
    new_title = re.sub(rstr, "", content)
    return new_title


def get_list_from_file(filename):
    fp = open(filename, 'r')
    file_text = fp.read()
    file_text = file_text.replace('\t', ' ')
    mylist = file_text.split('\n')
    for listitem in mylist:
        if listitem.strip() == '':
            mylist.remove(listitem)
            continue
    fp.close()
    return mylist
