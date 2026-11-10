import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export const MarqueeTicker = () => {
  const [tickerItems, setTickerItems] = useState([
    { id: 1, name: 'Gula Aren', price: '45K', is_down: false },
    { id: 2, name: 'Croissant', price: '35K', is_down: false },
    { id: 3, name: 'Espresso', price: '25K', is_down: true },
    { id: 4, name: 'Sourdough', price: '55K', is_down: false },
    { id: 5, name: 'Cold Brew', price: '33K', is_down: false },
    { id: 6, name: 'Cinnamon Roll', price: '32K', is_down: true },
  ]);

  useEffect(() => {
    api.getTicker()
      .then((data) => {
        if (data && data.length > 0) setTickerItems(data);
      })
      .catch((err) => console.log('Using default ticker items:', err.message));
  }, []);

  return (
    <section className="marquee" aria-label="Menu ticker">
      <div className="marquee__row marquee__row--solid">
        <div className="marquee__track">
          {tickerItems.map((item, idx) => (
            <span key={`a-${idx}`} className={`ticker-item ${item.is_down ? 'is-down' : ''}`}>
              <i className="fa-solid fa-caret-up" aria-hidden="true" />
              {item.name} <b>{item.price}</b>
            </span>
          ))}
          <span aria-hidden="true">
            {tickerItems.map((item, idx) => (
              <span key={`b-${idx}`} className={`ticker-item ${item.is_down ? 'is-down' : ''}`}>
                <i className="fa-solid fa-caret-up" aria-hidden="true" />
                {item.name} <b>{item.price}</b>
              </span>
            ))}
          </span>
        </div>
      </div>
      <div className="marquee__row marquee__row--outline marquee__row--reverse">
        <div className="marquee__track">
          <span>Est. 2026 — Serang — Indonesia — Fresh, daily, logged by hand —&nbsp;</span>
          <span aria-hidden="true">Est. 2026 — Serang — Indonesia — Fresh, daily, logged by hand —&nbsp;</span>
        </div>
      </div>
    </section>
  );
};

