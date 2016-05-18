#-*-coding:utf8-*-
import const
from utility import *
import os
import re
import time


import sys
reload(sys)
sys.setdefaultencoding('utf-8')


# if you have not found all match lists, mark it as False
FORCE_FIND_MATCH_LIST = False


def get_entries(content, proc_league=None):
    reg = r'\?league_id=[0-9]{1,6}'
    league_re = re.compile(reg)
    league_list = re.findall(league_re, content)
    league_set = set(league_list)
    x = 0
    string_to_write = ''
    for league_id in league_set:
        string_to_write += 'http://www.dotamax.com/match/tour_matches/'+league_id+'\n'
        x += 1
    print 'You have found', x, 'leagues pages in this directory. Wrote to "saved_data/leagues_list.txt'
    # string_to_write = str(x) + string_to_write
    if not os.path.exists(const.FN_DATADIR):
        os.mkdir(const.FN_DATADIR)
    fp = open(const.FN_DATADIR+const.FN_LEAGUE_LIST, 'w+')
    fp.write(string_to_write)
    fp.close()


def proc_league(myurl):
    print 'processing:', myurl
    code, html = get_html(myurl)
    status = code // 100
    if not (status == 2 or status == 3):
        print 'Bad sublink, going to the next url...'
        return
    html = html.replace('\n', ' ')
    html = html.replace('\t', ' ')
    html_tree = etree.HTML(html.decode('utf-8'))
    mytitle_list = get_from_etree(html_tree, 'title')
    title_string = ''
    if mytitle_list:
        title_string = mytitle_list[0].text
        title_string = title_string.replace('<title>', ' ')
        title_string = title_string.replace('</title>', ' ')
        title_string = title_string.replace(u'-  Dotamax - 做国内第一游戏数据门户', ' ')
        title_string = title_string.replace('\n', ' ')
        title_string = title_string.strip()
        title_string = clear_illegal_chars(title_string)
        print 'league name:', title_string
    if not os.path.exists(const.FN_DATADIR+const.FN_LEAGUE_DIR):
        os.mkdir(const.FN_DATADIR+const.FN_LEAGUE_DIR)
    if not os.path.exists(const.FN_DATADIR+const.FN_LEAGUE_DIR+'/'+title_string):
        os.mkdir(const.FN_DATADIR+const.FN_LEAGUE_DIR+'/'+title_string)
    if not os.path.exists(const.FN_DATADIR+const.FN_LEAGUE_DIR+'/'+title_string+const.FN_MATCH_LIST):
        match_regex = r'/match/detail/[0-9]{9,11}'
        match_re = re.compile(match_regex)
        match_list = re.findall(match_re, html)
        match_set = set(match_list)
        page_num = 1
        print 'Processing: Page', page_num
        while True:
            print 'Processed Match Page', page_num
            page_num += 1
            code, html = get_html(myurl + const.URL_DOTAMAX_MATCHPAGE + str(page_num))
            status = code // 100
            if not (status == 2 or status == 3):
                print 'Bad match list query...'
                break
            match_list = re.findall(match_re, html)
            if not match_list or (match_list and match_list[0] in match_set):
                break
            tmp_set = set(match_list)
            match_set = match_set | tmp_set
        match_list_string = ''
        for i in match_set:
            match_list_string += i + '\n'
        fp = open(const.FN_DATADIR+const.FN_LEAGUE_DIR+'/'+title_string+const.FN_MATCH_LIST, 'w')
        fp.write(match_list_string)
        fp.close()
    # print 'You found', len(match_set), 'matches in this league'


def proc_league_list():
    if not os.path.exists(const.FN_DATADIR+const.FN_LEAGUE_LIST):
        print 'error...please rerun the whole program to generate leagues list'
        return None
    else:
        print 'Start Processing League List Cached'
        return get_list_from_file(const.FN_DATADIR+const.FN_LEAGUE_LIST)


def gen_league_list():
    print 'Generate League List from Beginning.'
    code, html = get_html(const.URL_DOTAMAX_TOUR)
    status = code // 100
    if status == 2 or status == 3:
        get_entries(html)
    else:
        print 'bad url link, program terminating...'


def proc_match_list(myfunc=None):
    if not os.path.exists(const.FN_DATADIR+const.FN_LEAGUE_DIR):
        print 'Error, please rerun the script to generate match lists'
        return
    rootdir = const.FN_DATADIR+const.FN_LEAGUE_DIR

    if not os.path.exists(const.FN_DATADIR+const.FN_RESULT_DIR):
        # print 'Results already exists. Delete it before we can start moving. Exiting...'
        #return
        os.mkdir(const.FN_DATADIR+const.FN_RESULT_DIR)
    mydatestamp = time.strftime('%Y%m%d%H%M%S', time.localtime(time.time()))
    counter = 0
    for parent, dirs, files in os.walk(rootdir):
        for dirname in dirs:
            print 'Now Processing', dirname
            if not os.path.exists(const.FN_DATADIR+const.FN_LEAGUE_DIR+'\\'+dirname+const.FN_MATCH_LIST):
                print const.FN_DATADIR+const.FN_LEAGUE_DIR+dirname+const.FN_MATCH_LIST
                print 'Error in finding match list file'
                return
            match_list = get_list_from_file(const.FN_DATADIR+const.FN_LEAGUE_DIR+'\/'+dirname+const.FN_MATCH_LIST)
            if myfunc:
                for i in match_list:
                    match_id = re.sub(r'\/match\/detail\/', '', i)
                    myfunc(match_id, mydatestamp)
                    counter += 1
    print 'Finished process of', counter, 'matches'


def proc_match(myurl, datestamp):
    print 'Processing ', myurl, 'at', datestamp
    # myurl = const.URL_DOTAMAX_PREFIX+'/match/detail/vision/'+myurl+'/'
    myurl = 'http://www.dotabuff.com/matches/'+myurl+'/vision'
    html = get_html(myurl)


def main():
    """
    Driver function
    """
    if not os.path.exists(const.FN_DATADIR+const.FN_LEAGUE_LIST):
        gen_league_list()
    if (not os.listdir(const.FN_DATADIR+const.FN_LEAGUE_DIR)) or FORCE_FIND_MATCH_LIST:
        league_list = proc_league_list()
        if league_list:
            for league_url in league_list:
                proc_league(league_url)
    proc_match_list(proc_match)



# start from here as the main driver
main()
