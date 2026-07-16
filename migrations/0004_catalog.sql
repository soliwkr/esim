-- Catalogo iniziale, provider e contenuti sottoposti a quality gate.
INSERT OR REPLACE INTO providers(slug,name,official_url,affiliate_disclosure,active,checked_at) VALUES('airalo','Airalo','https://www.airalo.com/','Programma affiliate/partner ufficiale da attivare solo dopo approvazione.',1,'2026-07-16');
INSERT OR REPLACE INTO providers(slug,name,official_url,affiliate_disclosure,active,checked_at) VALUES('holafly','Holafly','https://esim.holafly.com/','Programma affiliate ufficiale da attivare solo dopo approvazione.',1,'2026-07-16');
INSERT OR REPLACE INTO providers(slug,name,official_url,affiliate_disclosure,active,checked_at) VALUES('ubigi','Ubigi','https://www.ubigi.com/','Eventuale monetizzazione da verificare attraverso canali ufficiali.',1,'2026-07-16');
INSERT OR REPLACE INTO destinations(slug,name,country_code,region,active) VALUES('giappone','Giappone','JP','Asia',1);
INSERT OR REPLACE INTO destinations(slug,name,country_code,region,active) VALUES('usa','USA e Stati Uniti','US','Nord America',1);
INSERT OR REPLACE INTO destinations(slug,name,country_code,region,active) VALUES('turchia','Turchia','TR','Europa/Asia',1);
INSERT OR REPLACE INTO destinations(slug,name,country_code,region,active) VALUES('egitto','Egitto','EG','Africa',1);
INSERT OR REPLACE INTO destinations(slug,name,country_code,region,active) VALUES('thailandia','Thailandia','TH','Asia',1);
INSERT OR REPLACE INTO destinations(slug,name,country_code,region,active) VALUES('albania','Albania','AL','Europa',1);
INSERT OR REPLACE INTO destinations(slug,name,country_code,region,active) VALUES('svizzera','Svizzera','CH','Europa',1);
INSERT OR REPLACE INTO destinations(slug,name,country_code,region,active) VALUES('dubai-emirati','Dubai ed Emirati Arabi','AE','Medio Oriente',1);
INSERT OR REPLACE INTO destinations(slug,name,country_code,region,active) VALUES('oman','Oman','OM','Medio Oriente',1);
INSERT OR REPLACE INTO destinations(slug,name,country_code,region,active) VALUES('zanzibar','Zanzibar','TZ','Africa',1);
INSERT OR REPLACE INTO destinations(slug,name,country_code,region,active) VALUES('repubblica-dominicana','Repubblica Dominicana','DO','Caraibi',1);
