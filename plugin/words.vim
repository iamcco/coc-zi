"===============================================================================
"File: plugin/words.vim
"Maintainer: iamcco <ooiss@qq.com>
"Licence: Vim Licence
"Version: 1.0.0
"===============================================================================

if exists('g:words_loaded')
    finish
endif
let g:words_loaded= 1

let s:save_cpo = &cpoptions
set cpoptions&vim

let s:words_path = expand('<sfile>:p:h:h') . '/words/10k.txt'

execute 'set dictionary+=' . s:words_path

let &cpoptions = s:save_cpo
unlet s:save_cpo
