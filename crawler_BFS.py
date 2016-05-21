# -*-coding:utf8-*-

"""
Used beautifulsoup4
"""

import json
import const
from utility import *
import os
import re
import time
from bs4 import BeautifulSoup
# import BeautifulSoup

import sys
reload(sys)
sys.setdefaultencoding('utf-8')


# if you have not found all match lists, mark it as False
FORCE_FIND_MATCH_LIST = False
FORCE_CACHE = True  # careful, it will pop out a lot of html cache files, only for debug mode
FORCE_CACHE_AUTOCLEAN = True  # with autoclean, the cached html will be cleaned after the whole has been processed


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


def proc_match_list(func_list=None):
    if not os.path.exists(const.FN_DATADIR+const.FN_LEAGUE_DIR):
        print 'Error, please rerun the script to generate match lists'
        return
    rootdir = const.FN_DATADIR+const.FN_LEAGUE_DIR
    if not os.path.exists(const.FN_DATADIR+const.FN_RESULT_DIR):
        # print 'Results already exists. Delete it before we can start moving. Exiting...'
        # return
        os.mkdir(const.FN_DATADIR+const.FN_RESULT_DIR)
    # mydatestamp = time.strftime('%Y%m%d%H%M%S', time.localtime(time.time()))
    # os.mkdir(const.FN_DATADIR+const.FN_RESULT_DIR+'/'+mydatestamp)
    counter = 0
    for parent, dirs, files in os.walk(rootdir):
        for dirname in dirs:
            print 'Now Processing', dirname
            if not os.path.exists(const.FN_DATADIR+const.FN_LEAGUE_DIR+'\\'+dirname+const.FN_MATCH_LIST):
                print const.FN_DATADIR+const.FN_LEAGUE_DIR+dirname+const.FN_MATCH_LIST
                print 'Error in finding match list file'
                return
            match_list = get_list_from_file(const.FN_DATADIR+const.FN_LEAGUE_DIR+'\/'+dirname+const.FN_MATCH_LIST)
            for i in match_list:
                match_id = re.sub(r'\/match\/detail\/', '', i)
                if func_list:
                    for func in func_list:
                        if not os.path.exists(const.FN_DATADIR+const.FN_RESULT_DIR+'/res_' +
                                              match_id):
                            os.mkdir(const.FN_DATADIR+const.FN_RESULT_DIR+'/res_' + match_id)
                        filename = (const.FN_DATADIR+const.FN_RESULT_DIR+'/res_' +
                                    match_id + '/' + func.__name__ + '.json')
                        if func and not os.path.exists(filename):
                            try:
                                func(match_id, filename)
                            except IndexError:
                                print 'Error in dotabuff page, skipping...'
                                continue
                counter += 1
    print 'Finished process of', counter, 'matches'


def proc_hero_info(hero):
    """
    Process the hero info for match_overview
    :param hero:
    :return:
    """
    hero_dict = dict()
    player_td = hero.find('td', {'class': 'cell-match-player-name'})
    player_info_anchor = player_td.find_all('a', {'class': 'link-type-player'})[0]
    hero_dict['player_name'] = str(player_info_anchor.text)
    hero_dict['player_id'] = str(player_info_anchor.attrs['href'])

    # hero:
    hero_div = hero.find_all('div', {'class': 'image-container-hero'})[0]
    hero_dict['hero_name'] = hero_div.a.attrs['href']

    # lane:
    hero_dict['lane'] = player_td.div.span.acronym.text

    # hero_info:
    hero_group_1 = hero.find_all('td', {'class': 'r-group-1'})
    hero_group_2 = hero.find_all('td', {'class': 'r-group-2'})
    hero_group_3 = hero.find_all('td', {'class': 'r-group-3'})

    hero_dict['level'] = str(hero_group_1[0].text)
    hero_dict['kills'] = str(hero_group_1[1].text)
    hero_dict['deaths'] = str(hero_group_1[2].text)
    hero_dict['assists'] = str(hero_group_1[3].text)
    hero_dict['kda'] = str(hero_group_1[4].text)

    hero_dict['gold'] = str(hero_group_2[0].text)
    hero_dict['lh'] = str(hero_group_2[1].text)
    hero_dict['dn'] = str(hero_group_2[2].text)
    hero_dict['xpm'] = str(hero_group_2[3].text)
    hero_dict['gpm'] = str(hero_group_2[4].text)

    hero_dict['hd'] = str(hero_group_3[0].text)
    hero_dict['hh'] = str(hero_group_3[1].text)
    hero_dict['td'] = str(hero_group_3[2].text)

    return hero_dict


def proc_force_cache(myurl, cache_filename):
    if FORCE_CACHE:
        if not os.path.exists(cache_filename):
            code, html = get_html(myurl)
            fp = open(cache_filename, 'w')
            fp.write(html)
            fp.close()
        else:
            fp = open(cache_filename, 'r')
            html = fp.read()
            fp.close()
    else:
        code, html = get_html(myurl)
    return html


def proc_remove_cache(cache_filename):
    if FORCE_CACHE_AUTOCLEAN and FORCE_CACHE:
        if os.path.exists(cache_filename):
            os.remove(cache_filename)


def proc_get_keyword(event_text):
    """
    Find all keywords in event_text
    :param event_text:
    :return:
    """
    kw_action_set = set()
    kw_target_set = set()
    kw_supplement_set = set()
    kw_position_set = set()
    for word in const.KW_ACTION_LIST:
        if str(word) in event_text:
            kw_action_set.add(str(word))
    for word in const.KW_TARGET_LIST:
        if str(word) in event_text:
            kw_target_set.add(str(word))
    for word in const.KW_SUPPLEMENT_LIST:
        if str(word) in event_text:
            kw_supplement_set.add(str(word))
    for word in const.KW_POSITION_LIST:
        if str(word) in event_text:
            kw_position_set.add(str(word))
    return kw_action_set, kw_target_set, kw_supplement_set, kw_position_set


def match_overview(match_id, filename):
    print 'Processing match', match_id, 'for overview'
    myurl = 'http://www.dotabuff.com/matches/' + match_id
    cache_filename = const.FN_DATADIR+const.FN_CACHED_HTML+match_id
    html = proc_force_cache(myurl, cache_filename)
    soup = BeautifulSoup(html, 'html.parser')  # need to include lxml to avoid warning from bs4

    # getting match result
    result_text = str(soup.find_all('div', {'class': 'match-result'})[0].text)

    if result_text.strip() == 'Radiant Victory':
        winner = 'radiant'
    else:
        winner = 'dire'

    # getting factions
    faction_dict = dict()
    faction_dict['dire'] = dict()
    faction_dict['radiant'] = dict()

    team_results = soup.find_all('div', {'class': 'team-results'})[0]

    radiants = team_results.find_all('section', {'class': 'radiant'}, False)[0]
    dires = team_results.find_all('section', {'class': 'dire'}, False)[0]

    faction_dict['dire']['team_id'] = str(dires.header.a.attrs['href'])
    faction_dict['dire']['team_name'] = str(dires.header.text)
    faction_dict['radiant']['team_id'] = str(radiants.header.a.attrs['href'])
    faction_dict['radiant']['team_name'] = str(radiants.header.text)
    # getting heros and players

    faction_dict['dire']['heroes'] = []
    faction_dict['radiant']['heroes'] = []

    radiant_heroes = radiants.find_all('tr', {'class': 'faction-radiant'})
    dire_heroes = dires.find_all('tr', {'class': 'faction-dire'})

    # process heros from both sides
    for hero in radiant_heroes:
        # player name:
        hero_dict = proc_hero_info(hero)

        # append finally
        faction_dict['radiant']['heroes'].append(hero_dict)

    for hero in dire_heroes:
        # player name:
        hero_dict = proc_hero_info(hero)

        # append finally
        faction_dict['dire']['heroes'].append(hero_dict)

    # ban pick
    r_only = team_results.find_all('div', {'class': 'r-only'}, False)[0]



    # write the result into file as json
    fp = open(filename, 'w+')
    json.dump({'factions': faction_dict, 'winner': winner}, fp, False, True, True, True, None, 4)
    fp.close()

    # process autoclean for cache
    proc_remove_cache(cache_filename)
    # to debug on one, uncomment the exit()
    # exit()


def match_vision(match_id, filename):
    """
    :param match_id:
    :param filename:
    :return:
    """
    print 'Processing match', match_id, 'for visions'
    # match_id = const.URL_DOTAMAX_PREFIX+'/match/detail/vision/'+match_id+'/'
    myurl = 'http://www.dotabuff.com/matches/' + match_id + '/vision'
    cache_filename = const.FN_DATADIR+const.FN_CACHED_HTML+match_id+'_vision'
    html = proc_force_cache(myurl, cache_filename)

    soup = BeautifulSoup(html, 'html.parser')  # need to include lxml to avoid warning from bs4

    # the details
    match_log_div = soup.find_all('div', {'class': 'match-log'})
    # match_visions = soup.find_all('div', {'class': 'vision-icon'})
    if len(match_log_div) == 0:  # or len(match_visions) == 0:
        print 'Missing Page on this match or Error in this HTML format for dotabuff'
        return
    all_events = match_log_div[0].find_all('div', {'class': 'event'}, False)

    # Getting all events
    event_list = []
    for event in all_events:
        # event_text = event.text
        event_dict = dict()
        if not event.div or not event.div.div:
            continue
        event_dict['time'] = str(event.div.find('span', {'class': 'time'}).text)
        anchors = event.div.div.find_all('a')

        # find position style
        extras_span = event.find('span', {'class': 'extras'})
        if extras_span:
            tooltip_span = extras_span.find('span', {'class': 'tooltip-wrapper'})
            if tooltip_span:
                minimap = tooltip_span.find('span', {'class': 'minimap-tooltip'})
                if minimap and minimap.span:
                    position_text = str(minimap.span.attrs['style'])
                    # print 'position_text:', position_text
                    pos_list = re.findall(r'([0-9]+%)', position_text)
                    if len(pos_list) == 2:
                        event_dict['top'] = pos_list[0]
                        event_dict['left'] = pos_list[1]

        counter = 0
        event_targets = []
        event_dict['action'] = str(event.div.div.text)
        for item in anchors:
            if counter == 0:
                event_dict['host'] = str(item.text.strip().lower())
                if 'attrs' in item and 'class' in item.attrs:
                    if 'color-faction-dire' in item.attrs['class']:
                        event_dict['host_fraction'] = 'dire'
                    elif 'color-faction-radiant' in item.attrs['class']:
                        event_dict['host_fraction'] = 'radiant'
            elif counter == 1:
                event_dict['item'] = str(item.text.strip().lower())
            else:
                if item.img and 'alt' in item.img.attrs:
                    to_append = str(item.img.attrs['alt'].strip())
                    if len(to_append):
                        event_targets.append(to_append)
            counter += 1
            event_dict['action'] = str(re.sub(item.text.strip(), '', event_dict['action']).strip())
        if len(event_targets):
            event_dict['targets'] = event_targets

        """ FOR DEBUG ONLY:
        sample_string = ''
        for k, v in event_dict.items():
            if isinstance(v, list) or isinstance(v, tuple):
                list_str = ''
                for i in v:
                    list_str += (i + ',')
            else:
                list_str = str(v)
            sample_string += (str(k) + ':' + str(list_str) + ';')
        # print sample_string
        """

        event_list.append(event_dict)

    # write the result into file as json
    fp = open(filename, 'w+')
    json.dump({'match_vision': event_list}, fp, False, True, True, True, None, 4)
    fp.close()

    # process autoclean for cache
    proc_remove_cache(cache_filename)
    # to debug on one, uncomment the exit()
    # exit()


def match_log(match_id, file_name):
    """
    Getting all event log
    :param match_id:
    :param file_name:
    :return:
    """
    print 'Processing match', match_id, 'for log'

    myurl = 'http://www.dotabuff.com/matches/' + match_id + '/log'
    cache_filename = const.FN_DATADIR+const.FN_CACHED_HTML+match_id+'_log'
    html = proc_force_cache(myurl, cache_filename)

    soup = BeautifulSoup(html, 'html.parser')  # need to include lxml to avoid warning from bs4
    match_log_class = soup.find('div', {'class': 'match-log'})

    if len(match_log_class) == 0:
        print 'Missing Page on this match or Error in this HTML format for dotabuff'
        return
    all_events = match_log_class.find_all('div', {'class': 'event'}, False)
    # all_events_soup = soup.find_all('div', {'class': 'event'})
    event_list = []

    for event in all_events:
        # print '=========new event=========='
        # print str(event)
        event_dict = dict()

        # parse time
        event_dict['time'] = str(event.find('span', {'class': 'time'}).text)

        # parse position
        event_position = event.find('span', {'class': 'map-item'})
        if event_position and hasattr(event_position, 'attrs') and 'style' in event_position.attrs:
            position_text = str(event_position.attrs['style'])
            pos_list = re.findall(r'([0-9]+%)', position_text)
            if len(pos_list) == 2:
                event_dict['top'] = pos_list[0]
                event_dict['left'] = pos_list[1]

        # print event.text
        kw_action_set, kw_target_set, kw_supplement_set, kw_position_set = proc_get_keyword(event.text)
        # print kw_set
        # get all anchors
        anchors = event.div.div.find_all('a', {'class': 'object'})
        obj_spans = event.div.div.find_all('span', {'class': 'object'})
        tower_spans = event.div.div.find_all('span', {'class': 'tower'})
        barrack_spans = event.div.div.find_all('span', {'class': 'barracks'})
        radiant_spans = event.div.div.find_all('span', {'class': 'the-radiant'})
        dire_spans = event.div.div.find_all('span', {'class': 'the-dire'})
        counter = 0

        all_items = set(anchors) | set(obj_spans) | set(tower_spans) | set(barrack_spans)
        all_sbj_spans = set(obj_spans) | set(radiant_spans) | set(dire_spans)

        other_targets = []
        # get objects
        for item in anchors:
            if len(str(item.text).strip()):
                item_text = str(item.text).strip().lower()
            else:
                item_text = str(item.attrs['href']).strip().lower()
                item_text = re.sub(r'\/heroes\/', '', item_text).strip()

            if counter == 0:
                event_dict['subject'] = item_text
            elif counter == 1:
                event_dict['whom'] = item_text
            else:
                # if other cases
                if 'killed by' in kw_action_set:
                    if 'autoattack' not in kw_supplement_set and counter == 2:
                        event_dict['skill'] = item_text
                    else:
                        other_targets.append(item_text)
                    golds_text = re.findall(r'[0-9]+g', event.text)
                    if len(golds_text):
                        event_dict['gold-lost'] = golds_text[0]
                        event_dict['gold-fed'] = golds_text[1]
            counter += 1
        # end of iteration over all anchors
        for item in all_sbj_spans:
            item_text = str(item.text).strip().lower()
            if 'subject' not in event_dict:
                event_dict['subject'] = item_text
            elif 'whom' not in event_dict:
                event_dict['whom'] = item_text

        if ':' in kw_action_set:
            if len(kw_action_set) == 1:
                kw_action_set = {'speak'}
            else:
                kw_action_set.remove(':')

        if len(kw_action_set) == 0:
            event_dict['action'] = 'unknown'
        elif len(kw_action_set) == 1:
            event_dict['action'] = list(kw_action_set)[0]
        else:
            event_dict['action'] = list(kw_action_set)

        if len(kw_target_set) == 1:
            event_dict['target'] = list(kw_target_set)[0]
        elif len(kw_target_set) > 1:
            event_dict['target'] = list(kw_target_set)

        if len(kw_supplement_set) == 1:
            event_dict['supplement'] = list(kw_supplement_set)[0]
        elif len(kw_supplement_set) > 1:
            event_dict['supplement'] = list(kw_supplement_set)

        if len(kw_position_set) == 1:
            event_dict['position'] = list(kw_position_set)[0]
        elif len(kw_position_set) > 1:
            event_dict['position'] = list(kw_position_set)

        if len(other_targets) == 1:
            event_dict['other-objects'] = other_targets[0]
        elif len(other_targets) > 1:
            event_dict['other-objects'] = other_targets

        # append it to event_list
        event_list.append(event_dict)
        print str(event_dict)  # for debug


    # end of iteration of events
    exit()  # for debug
    # process event log write to json file

    fp = open(file_name, 'w+')
    json.dump({'events': event_list}, fp, False, True, True, True, None, 4)
    fp.close()

    # end of process, cleaning optionally
    proc_remove_cache(cache_filename)


def main():
    """
    Driver function
    """
    func_list = [match_overview, match_vision, match_log]
    if not os.path.exists(const.FN_DATADIR+const.FN_LEAGUE_LIST):
        gen_league_list()
    if (not os.listdir(const.FN_DATADIR+const.FN_LEAGUE_DIR)) or FORCE_FIND_MATCH_LIST:
        league_list = proc_league_list()
        if league_list:
            for league_url in league_list:
                proc_league(league_url)
    proc_match_list(func_list)



# start from here as the main driver
main()
