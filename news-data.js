/* Lab news — single source of truth.
   Used by: index.html (hero ticker + homepage "Lab news" section) and news.html (full archive).
   Edit freely, newest first. Fields:
     date  — short label; a 4-digit year (e.g. "2026") groups it on the archive page, others bucket under "Ongoing"
     tag   — category: Publication / Award / Grant / Talk / Team / …
     head  — headline
     desc  — one-line description (optional)
     href  — link target (optional; omit or use "#" for a non-clickable item) */
window.MULAB_NEWS = [
  {date:'2026', tag:'Publication', head:'New paper published in Cancer Letters!', href:'https://www.sciencedirect.com/science/article/pii/S0304383526002284'},
  {date:'2026', tag:'Award', head:'Yaru received NCI K99/R00 award on the first submission!'},
  {date:'2026', tag:'Event', head:'The Yale Prostate Cancer Symposium was successfully held!', href:'gallery.html'},
  {date:'2026', tag:'Award', head:'Siyuan received the AUA award! Congratulations!'},
  {date:'2026', tag:'Award', head:'Yaru received the AUA award! Congratulations!'}
];
