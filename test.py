from utility import *
import os
import const


def test_file():
    fp = open('random.txt', 'a+')
    print_and_write('test\ntest', fp)
    fp.close()


def test_failing_url():
    myurl = 'http://www.dotamax.com/match/tour_matches/?league_id=4554&skill=&ladder=&p=8'
    code, html = get_html(myurl)
    print 'code:', code, '\nhtml:', html


def test_file_exists():
    print os.path.exists('saved_data')


def test_url_regex():
    print check_url_format('http://www.baidu.com')
    print check_url_format('jijiji')


# test_url_regex()
# test_file_exists()

code, page = get_html(const.URL_DOTAMAX_PREFIX)
print code
print page
# test_failing_url()
