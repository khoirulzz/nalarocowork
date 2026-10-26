const paths={
 people:'M4 20v-2a5 5 0 0 1 10 0v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-7a4 4 0 0 1 0 7m1 4a4 4 0 0 1 4 4v1',
 command:'m5 6 5 5-5 5m8 1h6M3 2h18v20H3z',
 objects:'m12 3 9 5-9 5-9-5 9-5Zm-9 5v10l9 5 9-5V8M12 13v10',
 history:'M4 8a9 9 0 1 1-1 8M4 3v5h5m3-1v6l4 2',
 settings:'M4 6h16M4 18h16M8 3v6m8 6v6M4 12h16m-3-3v6',
 plus:'M12 5v14M5 12h14',minus:'M5 12h14',reset:'M3 9V3h6M3 3l6 6m6-6h6v6m0-6-6 6M3 15v6h6m-6 0 6-6m12 0v6h-6m6 0-6-6',
 close:'m6 6 12 12M6 18 18 6',focus:'M3 8V3h5m8 0h5v5m0 8v5h-5M8 21H3v-5M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z',
 send:'m4 4 17 8-17 8 4-8-4-8Zm4 8h13',pause:'M8 5v14M16 5v14',play:'m7 4 13 8-13 8V4Z',
 stairs:'M3 21v-6h6V9h6V3h6',chevron:'m9 5 7 7-7 7',copy:'M8 8h12v13H8zM4 16V3h12',search:'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Zm5-1 5 5'
};
export const icon=(name)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.objects}"/></svg>`;
