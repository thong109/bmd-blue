"use strict";

(() => {
  let __scrollY = 0;
  let __normalScrollY = 0;
  const isDesktop = () => window.innerWidth >= 1024.98;
  const tabletBreak = 1024.98;
  const mobileBreak = 767.98;
  const mobileXSBreak = 360;
  const Mask = document.querySelector(".mask"),
    WindBody = document.body,
    HTML = document.documentElement;
  history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  const delay = (time, callback) => setTimeout(callback, time);

  window.__APP_STATE__ = {
    observer: null,
  };

  const detectDevice = () => {
    const html = document.documentElement;

    const init = () => {
      const viewport = document.querySelector('meta[name="viewport"]');
      const userAgent = navigator.userAgent.toLowerCase();
      const orientation = window.matchMedia("(orientation: portrait)").matches;

      html.classList.toggle("is-device-mac", userAgent.includes("mac"));
      html.classList.toggle("is-device-macos", userAgent.includes("mac"));
      html.classList.toggle("is-device-iphone", /iphone/.test(userAgent));
      html.classList.toggle("is-device-ipod", /ipod/.test(userAgent));
      html.classList.toggle("is-device-ipad", /ipad/.test(userAgent));
      html.classList.toggle(
        "is-device-ios",
        /(iphone|ipod|ipad)/.test(userAgent),
      );
      html.classList.toggle("is-device-android", userAgent.includes("android"));

      if (navigator.maxTouchPoints === 1 && !userAgent.includes("mobile")) {
        html.classList.add("is-device-emulation");
      } else {
        html.classList.remove("is-device-emulation");
      }

      if (
        (html.classList.contains("is-device-mac") ||
          html.classList.contains("is-device-ios") ||
          html.classList.contains("is-device-android")) &&
        navigator.maxTouchPoints >= 1
      ) {
        html.classList.add("is-device-touchable");
      } else {
        html.classList.remove("is-device-touchable");
      }

      if (window.innerWidth < mobileBreak) {
        if (window.screen.width < mobileXSBreak) {
          viewport?.setAttribute(
            "content",
            `width=${mobileXSBreak}, user-scalable=0`,
          );
        } else {
          viewport?.setAttribute(
            "content",
            "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
          );
        }
        html.classList.add("is-device-mobile");
        html.classList.remove("is-device-desktop", "is-device-tablet");
      } else {
        html.classList.add("is-device-desktop");
        html.classList.remove("is-device-mobile");

        if (
          (window.screen.width >= mobileBreak &&
            window.screen.width <= tabletBreak) ||
          (window.screen.width < mobileBreak &&
            window.screen.height >= mobileBreak &&
            !orientation)
        ) {
          html.classList.add("is-device-tablet");
        } else {
          html.classList.remove("is-device-tablet");
        }

        viewport?.setAttribute(
          "content",
          "width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=0",
        );
      }
    };

    window.addEventListener("load", init);
    window.addEventListener("resize", init);
    init();
  };

  const app = () => {
    if (window.innerWidth < 1024.98) return;
    const isTablet = () => window.innerWidth < 1024.98;
    gsap.registerPlugin(Observer);

    const panels = Array.from(document.querySelectorAll(".panel"));
    const outers = panels.map((p) => p.querySelector(".group-central"));
    const inners = panels.map((p) => p.querySelector(".inner"));
    const images = panels.map((p) => p.querySelector(".group-bg"));
    const headings = panels.map((p) =>
      Array.from(p.querySelectorAll(".hero-title")).filter(
        (el) => !el.classList.contains("js-title-fade")
      )
    );
    const subs = panels.map((p) =>
      Array.from(p.querySelectorAll(".hero-sub")).filter(Boolean)
    );
    const stage = document.querySelector(".slider-stage");
    const navEl = document.getElementById("nav");
    const navItems = navEl ? navEl.querySelectorAll(".nav-item") : [];
    const headerLogo = document.getElementById("logo-primary");

    if (
      !headerLogo ||
      !stage ||
      !panels ||
      !outers ||
      !inners ||
      !images ||
      !headings ||
      !subs
    )
      return;

    const s = {
      cur: -1,
      lastPanel: 0,
      animating: false,
      active: true,
      switching: false,
      hidden: false,
      wheelLock: false,
      navLock: false,
      touchY: 0,
    };

    window.__APP_STATE__.sliderState = s;

    const updateLogo = (i) => {
      if (!headerLogo) return;
      const visible = isTablet() || i === 0;
      headerLogo.classList.toggle("is-visible", visible);
    };

    const SLIDER_COUNT = panels.length;

    const updateNav = (i) =>
      navItems.forEach((n, j) =>
        n.classList.toggle("active", j === i && j < SLIDER_COUNT)
      );

    const updateNavByTarget = (targetId) =>
      navItems.forEach((n) =>
        n.classList.toggle("active", n.dataset.target === targetId)
      );

    const showUI = () => {
      if (isTablet()) return;
      gsap.set(stage, {
        autoAlpha: 1,
        pointerEvents: "auto",
      });
    };

    const getOffset = (el, container) => {
      let top = 0;
      let current = el;
      while (current && current !== container) {
        top += current.offsetTop;
        current = current.offsetParent;
      }
      return top;
    };

    /* ---------------- NAV ---------------- */
    if (navItems.length) {
      navItems.forEach((item, idx) => {
        item.addEventListener("click", () => {
          if (s.navLock) return;

          if (isTablet()) {
            const target = document.getElementById(item.dataset.target);
            if (!target) return;
            target.scrollIntoView({
              behavior: "smooth",
            });
            return;
          }

          if (idx < SLIDER_COUNT) {
            if (!s.active) {
              s.navLock = true;
              relock(idx, () => (s.navLock = false));
            } else {
              if (s.animating) return;
              goto(idx, idx > s.cur ? 1 : -1);
            }
          } else {
            const target = document.getElementById(item.dataset.target);
            if (!target) return;

            s.navLock = true;
            updateNavByTarget(item.dataset.target);

            const normalScroll = document.querySelector(".normal-scroll");

            release(() => {
              if (normalScroll) {
                const y = getOffset(target, normalScroll);

                window.scrollTo({
                  top: y,
                  behavior: "smooth",
                });
              } else {
                target.scrollIntoView({
                  behavior: "smooth",
                });
              }

              setTimeout(() => (s.navLock = false), 1000);
            });
          }
        });
      });
    }

    /* ---------------- EXPLORE CTA ---------------- */
    const exploreBtn = document.querySelector(
      ".section-top-keyvisual .hero-sub",
    );

    if (exploreBtn) {
      exploreBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (s.animating || s.navLock) return;

        const hash = (exploreBtn.getAttribute("href") || "").split("#")[1];
        const panelIndex = panels.findIndex((panel) => panel.id === hash);
        if (panelIndex < 0) return;

        if (!s.active) {
          s.navLock = true;
          relock(panelIndex, () => (s.navLock = false));
        } else {
          goto(panelIndex, panelIndex > s.cur ? 1 : -1);
        }
      });
    }

    const mobileLinks = document.querySelectorAll(
      ".navigation-menu .item-link"
    );

    if (mobileLinks.length) {
      mobileLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
          const href = link.getAttribute("href") || "";
          const hash = href.split("#")[1];

          // If no hash, allow normal navigation
          if (!hash) {
            window.dispatchEvent(new CustomEvent("header:close-menu"));
            return;
          }

          e.preventDefault();

          const panelIndex = panels.findIndex((panel) => panel.id === hash);
          const navItem = Array.from(navItems).find(
            (item) => item.dataset.target === hash
          );
          if (!navItem && panelIndex < 0) return;

          window.dispatchEvent(new CustomEvent("header:close-menu"));

          setTimeout(() => {
            if (s.active) {
              observer?.enable();
            }

            if (panelIndex >= 0 && !s.active) {
              s.navLock = true;
              relock(panelIndex, () => (s.navLock = false));
            } else if (panelIndex >= 0 && !s.animating) {
              goto(panelIndex, panelIndex > s.cur ? 1 : -1);
            } else if (navItem) {
              navItem.click();
            }
          }, 550);
        });
      });
    }

    /* ---------------- GOTO ---------------- */
    const goto = (i, dir, cb) => {
      if (isTablet()) return;

      if (i >= panels.length) {
        s.animating = false;
        cb?.();
        return;
      }

      i = Math.max(i, 0);
      const d = dir === -1 ? -1 : 1;
      const same = i === s.cur;

      showUI();
      updateLogo(i);

      if (same) {
        gsap.set(panels[i], {
          autoAlpha: 1,
          zIndex: 1,
        });

        const sameTargets = [outers[i], inners[i], images[i]].filter(Boolean);
        if (sameTargets.length)
          gsap.set(sameTargets, {
            clearProps: "transform",
          });

        if (headings[i]?.length)
          headings[i].forEach((h) =>
            gsap.set(h, {
              autoAlpha: 1,
              yPercent: 0,
            })
          );
        if (subs[i]?.length)
          subs[i].forEach((sub) =>
            gsap.set(sub, {
              autoAlpha: 1,
              yPercent: 0,
            })
          );

        panels.forEach((p, idx) => p.classList.toggle("is-active", idx === i));
        s.animating = false;
        cb?.();
        return;
      }

      s.animating = true;
      const prev = s.cur;

      const tl = gsap.timeline({
        defaults: {
          duration: 1.05,
          ease: "power1.inOut",
        },
        onStart: () => {
          gsap.set(panels[i], {
            autoAlpha: 1,
            zIndex: 1,
          });
          panels[i].classList.add("is-active");

          if (prev >= 0 && prev !== i) {
            setTimeout(() => {
              panels[prev].classList.remove("is-active");
            }, 500);
          }
        },
        onComplete: () => {
          s.animating = false;
          panels.forEach((p, idx) => {
            if (idx !== i)
              gsap.set(p, {
                autoAlpha: 0,
                zIndex: 0,
              });
          });
          panels[i].querySelectorAll(".swiper").forEach((el) => {
            if (
              el.swiper &&
              !el.swiper.destroyed &&
              el.getClientRects().length
            ) {
              el.swiper.update();
            }
          });
          window.dispatchEvent(
            new CustomEvent("slider:panel-change", {
              detail: {
                index: i,
              },
            })
          );
          cb?.();
        },
      });

      if (prev >= 0) {
        gsap.set(panels[s.cur], {
          zIndex: 0,
        });

        if (images[s.cur]) {
          tl.to(
            images[s.cur], {
              yPercent: -14 * d,
            },
            0
          );
        }
      }

      const curTargets = [outers[i], inners[i]].filter(Boolean);
      if (curTargets.length) {
        tl.fromTo(
          curTargets, {
            yPercent: (j) => (j ? -100 * d : 100 * d),
            immediateRender: false,
          }, {
            yPercent: 0,
          },
          0
        );
      }

      if (images[i]) {
        tl.fromTo(
          images[i], {
            yPercent: 14 * d,
          }, {
            yPercent: 0,
          },
          0
        );
      }

      if (headings[i]?.length) {
        headings[i].forEach((h, j) => {
          tl.fromTo(
            h, {
              autoAlpha: 0,
              yPercent: 200 * d,
            }, {
              autoAlpha: 1,
              yPercent: 0,
              duration: 0.9,
              ease: "power2.out",
            },
            0.18
          );
        });
      }

      if (subs[i]?.length) {
        subs[i].forEach((sub, j) => {
          tl.fromTo(
            sub, {
              autoAlpha: 0,
              yPercent: 200 * d,
            }, {
              autoAlpha: 1,
              yPercent: 0,
              duration: 0.8,
              ease: "power2.out",
            },
            0.28
          );
        });
      }

      s.cur = i;

      window.__APP_STATE__.goto = goto;

      /* Update dark bg for panel with .js-bg */
      const currentPanel = panels[i];
      if (currentPanel) {
        const isBg = currentPanel.classList.contains("js-bg");
        const isLocation = currentPanel.classList.contains("js-bg-2");
        document.documentElement.classList.toggle("is-dark-bg", isBg);
        document.documentElement.classList.toggle(
          "is-dark-bg-02",
          isBg && isLocation
        );
      }
    };

    /* ---------------- RELEASE ---------------- */
    const release = (onDone) => {
      if (!s.active) {
        onDone?.();
        return;
      }

      s.lastPanel = s.cur;
      s.active = false;
      observer?.disable();
      document.documentElement.classList.remove("is-dark-bg", "is-dark-bg-02");
      const normalScroll = document.querySelector(".normal-scroll");

      gsap.to(stage, {
        autoAlpha: 0,
        duration: 0.6,
        ease: "power1.inOut",
        onComplete: () => {
          document.body.style.overflow = "";
          gsap.set(stage, {
            pointerEvents: "none",
            zIndex: -1,
          });

          window.scrollTo(0, 0);
          window.dispatchEvent(new Event("slider:released"));

          gsap.to(normalScroll, {
            autoAlpha: 1,
            duration: 0.5,
            onComplete: () => {
              onDone?.();
            },
          });
        },
      });
    };

    /* ---------------- RELOCK ---------------- */
    const relock = (targetPanel, onDone) => {
      if (isTablet()) return;
      if (s.active || s.switching) return;

      s.switching = true;
      const normalScroll = document.querySelector(".normal-scroll");

      const savedScrollTop = normalScroll ? normalScroll.scrollTop : 0;

      gsap.to(normalScroll, {
        autoAlpha: 0,
        duration: 0.6,
        onComplete: () => {
          document.body.style.overflow = "hidden";

          gsap.set(stage, {
            zIndex: "",
            pointerEvents: "auto",
            autoAlpha: 1,
          });

          const target = targetPanel ?? 0;

          panels.forEach((p, idx) => {
            gsap.set(p, {
              autoAlpha: idx === target ? 1 : 0,
              zIndex: idx === target ? 1 : 0,
            });
          });

          s.cur = target;
          s.active = true;
          s.switching = false;
          s.animating = false;
          panels.forEach((p, idx) =>
            p.classList.toggle("is-active", idx === target)
          );
          updateLogo(target);
          observer?.enable();
          onDone?.();
          window.dispatchEvent(
            new CustomEvent("slider:panel-change", {
              detail: {
                index: target,
              },
            })
          );

          setTimeout(() => {
            window.dispatchEvent(new Event("scroll"));
          }, 50);
        },
      });
    };

    /* ---------------- OBSERVER (DESKTOP ONLY) ---------------- */
    let observer = null;
    let panelListTarget = 0;
    let activeScrollList = null;

    const scrollPanelList = (direction, deltaY = 0) => {
      const panel = panels[s.cur];
      const list = panel?.querySelector(".capability-list");
      if (!list || list.scrollHeight <= list.clientHeight + 2) return false;

      if (activeScrollList !== list) {
        activeScrollList = list;
        panelListTarget = list.scrollTop;
      }

      const atTop = list.scrollTop <= 2;
      const atBottom =
        list.scrollTop + list.clientHeight >= list.scrollHeight - 2;

      const maxScroll = list.scrollHeight - list.clientHeight;
      const targetAtTop = panelListTarget <= 2;
      const targetAtBottom = panelListTarget >= maxScroll - 2;

      if (
        (direction < 0 && atTop && targetAtTop) ||
        (direction > 0 && atBottom && targetAtBottom)
      ) {
        return false;
      }

      const distance = Math.max(35, Math.min(Math.abs(deltaY) * 0.85, 160));
      panelListTarget = Math.max(
        0,
        Math.min(panelListTarget + direction * distance, maxScroll)
      );

      gsap.to(list, {
        scrollTop: panelListTarget,
        duration: 0.7,
        ease: "power3.out",
        overwrite: true,
      });
      return true;
    };

    const initObserver = () => {
      if (isTablet()) return;

      observer = Observer.create({
        type: "wheel,touch",
        wheelSpeed: -1,
        tolerance: 14,
        preventDefault: true,

        onDown: (self) => {
          if (!s.animating && s.active && !s.switching) {
            if (scrollPanelList(-1, self.deltaY)) return;
            goto(s.cur - 1, -1);
          }
        },

        onUp: (self) => {
          if (!s.animating && s.active && !s.switching) {
            if (scrollPanelList(1, self.deltaY)) return;
            goto(s.cur + 1, 1);
          }
        },
      });

      window.__APP_STATE__.observer = observer;
    };

    /* ---------------- START ---------------- */
    if (!isTablet()) {
      const hash = window.location.hash?.replace("#", "");

      goto(0, 1, () => {
        if (!hash) return;

        // Bỏ qua hash tabs (tab1, tab2...) - xử lý bởi initTabsFromHash
        if (/^tab\d+$/.test(hash)) return;

        history.replaceState(null, "", window.location.pathname);

        const matchedPanelIndex = panels.findIndex(
          (panel) => panel.id === hash
        );
        const matchedNavItem = Array.from(navItems).find(
          (item) => item.dataset.target === hash
        );

        setTimeout(() => {
          if (matchedPanelIndex >= 0) {
            goto(matchedPanelIndex, matchedPanelIndex > s.cur ? 1 : -1);
          } else if (matchedNavItem) {
            matchedNavItem.click();
          } else {
            const target = document.getElementById(hash);
            if (!target) return;
            if (s.active) {
              release(() =>
                target.scrollIntoView({
                  behavior: "smooth",
                })
              );
            } else {
              target.scrollIntoView({
                behavior: "smooth",
              });
            }
          }
        }, 100);
      });

      initObserver();
    } else {
      gsap.set(stage, {
        clearProps: "all",
      });
      panels.forEach((p) =>
        gsap.set(p, {
          clearProps: "all",
        })
      );
    }

    if (navItems.length) {
      const sectionIds = Array.from(navItems)
        .map((n) => n.dataset.target)
        .filter(Boolean);

      const sections = sectionIds
        .map((id) => document.getElementById(id))
        .filter(Boolean);

      if (sections.length) {
        const scrollSections = sections.filter(
          (sec) => !sec.classList.contains("panel")
        );
        const bgSections = scrollSections.filter((sec) =>
          sec.classList.contains("js-bg")
        );

        const updateDarkBg = () => {
          if (window.__APP_STATE__?.sliderState?.active) {
            return;
          }
          const anyVisible = bgSections.some((sec) => {
            const rect = sec.getBoundingClientRect();
            return rect.top < window.innerHeight && rect.bottom > 0;
          });
          document.documentElement.classList.toggle("is-dark-bg", anyVisible);
        };

        const updateNavOnScroll = () => {
          if (window.__APP_STATE__?.sliderState?.active) return;
          if (s.navLock) return;

          let best = null;
          let bestDist = Infinity;
          scrollSections.forEach((sec) => {
            const rect = sec.getBoundingClientRect();
            if (rect.bottom > 0) {
              const dist = Math.abs(rect.top);
              if (dist < bestDist) {
                bestDist = dist;
                best = sec;
              }
            }
          });
          if (best) updateNavByTarget(best.id);
        };

        window.addEventListener("scroll", updateDarkBg, {
          passive: true,
        });
        window.addEventListener("scroll", updateNavOnScroll, {
          passive: true,
        });

        const origRelease = release;
        window.addEventListener("slider:released", () => {
          setTimeout(() => {
            updateDarkBg();
            updateNavOnScroll();
          }, 650);
        });
      }
    }
  };

  const slideKeyvisual = () => {
    const sliders = document.querySelectorAll('.js-slider-keyvisual');
    if (!sliders.length) return;

    updateParallax(sliders);

    sliders.forEach((element) => {
      const swiper = new Swiper(element, {
        loop: true,
        parallax: true,
        speed: 2000,
        autoplay: {
          delay: 3000,
          disableOnInteraction: false
        },
        pagination: {
          el: element.querySelector('.swiper-pagination'),
          clickable: true
        },
        grabCursor: true
      });

      kvSliders.push(swiper);
    });

    window.addEventListener('resize', () => updateParallax(sliders));
  }

  let kvSliders = [];
  const updateParallax = (sliders) => {
    const isPC = window.matchMedia('(min-width: 768px)').matches;
    const parallaxValue = isPC ? 365 : 300;

    sliders.forEach((element) => {
      const slideImages = element.querySelectorAll('.slider-image');
      slideImages.forEach((img) => {
        img.dataset.swiperParallax = parallaxValue;
        img.dataset.swiperParallaxOpacity = 1;
      });
    });
  }

  // Helper

  const freezeWindow = (lock) => {
    const normalScroll = document.querySelector(".normal-scroll");
    const isProjectsDetail = document.documentElement.classList.contains(
      "is-page-projects-detail"
    );

    if (isProjectsDetail) {
      if (lock) {
        __scrollY = window.scrollY || window.pageYOffset;
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
      } else {
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";

        if (Math.abs(window.scrollY - __scrollY) > 1) {
          window.scrollTo(0, __scrollY);
        }
      }
      return;
    }

    if (lock) {
      __scrollY = window.scrollY || window.pageYOffset;
      __normalScrollY = normalScroll ? normalScroll.scrollTop : 0;

      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.position = "fixed";
      document.body.style.top = `-${__scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = scrollbarWidth + "px";
      }
    } else {
      const y = __scrollY;

      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      document.body.removeAttribute("style");

      if (y > 0) {
        window.scrollTo(0, y);
      }

      if (normalScroll) {
        normalScroll.scrollTop = __normalScrollY;
      }
    }
  };

  const getPopupElements = (id) => {
    const popup = document.getElementById(id);
    if (!popup) return null;

    return {
      popup,
      body: popup.querySelector(".popup-body"),
      title: popup.querySelector(".popup-title"),
      closeBtn: popup.querySelector(".popup-close"),
      overlay: popup.querySelector(".popup-overlay"),
    };
  };

  const initContactPopup = () => {
    const trigger = document.querySelector(".header-phone");
    const elements = getPopupElements("contactPopup");
    if (!trigger || !elements) return;

    const { popup, closeBtn, overlay } = elements;

    const openPopup = (event) => {
      event?.preventDefault();
      popup.classList.add("active");
      popup.setAttribute("aria-hidden", "false");
      freezeWindow(true);
      window.__APP_STATE__?.observer?.disable();
    };

    const closePopup = () => {
      if (!popup.classList.contains("active")) return;
      popup.classList.remove("active");
      popup.setAttribute("aria-hidden", "true");
      freezeWindow(false);
      if (window.__APP_STATE__?.sliderState?.active) {
        window.__APP_STATE__?.observer?.enable();
      }
    };

    trigger.addEventListener("click", openPopup);
    closeBtn?.addEventListener("click", closePopup);
    overlay?.addEventListener("click", closePopup);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closePopup();
    });
  };

  const initMobileAnimations = () => {
    if (isDesktop()) return;

    gsap.registerPlugin(ScrollTrigger);

    const targets = document.querySelectorAll(".js-title");
    if (!targets.length) return;

    targets.forEach((el) => {
      gsap.fromTo(
        el, {
          autoAlpha: 0,
          y: 100,
        }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        },
      );
    });
  };

  const Done = () => {
    const titles = document.querySelectorAll('.js-title-fade');
    if (!titles.length) return;

    let globalIndex = 0;

    titles.forEach((title) => {
      if (title.classList.contains('splitted')) return;
      title.classList.add('splitted');
      const text = title.textContent;
      const chars = text.split('');

      let html = '';
      chars.forEach((ch) => {
        if (ch === ' ') {
          html += `<span class="space"></span>`;
        } else {
          html += `
          <span class="char-wrap">
            <span class="char" style="line-height: 1; transform: translateY(120%); opacity: 0;">
              ${ch}
            </span>
          </span>
        `;
        }
      });

      title.innerHTML = html;
    });
  };

  const isIOSZalo = () => {
    const ua = navigator.userAgent;

    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" &&
        navigator.maxTouchPoints > 1);

    return isIOS && /Zalo/i.test(ua);
  };

  // End helper

  const initIntro = () => {
    Done();
    const isTablet = () => window.innerWidth < 1024.98;
    const maskIntro = document.getElementById("mask");

    const startApp = () => {
      setTimeout(() => {
        if (!isTablet()) {
          document.body.style.overflow = "hidden";
        }
        app();
        const video = document.getElementById("video-element");

        if (video) {
          video.play().catch(() => {
            console.warn("Autoplay blocked.");
          });
        }
        initMobileAnimations();
      }, 600);
    };

    if (!maskIntro) {
      WindBody.classList.add("showed");
      startApp();
      return;
    }

    if (isIOSZalo()) {
      Mask?.remove();

      WindBody.classList.add("showed");
      document.body.style.overflow = "";

      app();
      initMobileAnimations();

      // Khi mở từ Zalo: thay video bằng ảnh poster (không chạy video)
      const video = document.getElementById("video-element");
      if (video) {
        const poster = video.getAttribute("poster");
        const parent = video.parentElement;

        // Tạo ảnh thay thế video
        const img = document.createElement("img");
        img.className = "object-common";
        img.src = poster || "";
        img.alt = "BLUEMARQ Development";
        img.width = 1920;
        img.height = 1050;
        img.loading = "eager";

        // Thay video bằng ảnh
        parent?.replaceChild(img, video);
      }

      return;
    }

    window.scrollTo(0, 0);

    if (!isTablet()) {
      document.body.style.overflow = "hidden";
    } else {
      freezeWindow(true);
    }

    delay(1000, () => {
      Mask?.classList.add("showed");
    });
    delay(3000, () => {
      Mask?.classList.add("hide");
    });
    delay(3800, () => {
      Mask?.remove();

      setTimeout(() => {
        WindBody.classList.add("showed");

        const allChars = document.querySelectorAll(".char");
        const titles = document.querySelectorAll(".js-title-fade");

        allChars.forEach((el) => {
          el.style.animation = "none";
          el.style.transition =
            "transform 0.7s cubic-bezier(.22, 1, .36, 1), opacity 0.7s cubic-bezier(.22, 1, .36, 1)";
        });

        let accumulatedDelay = 0;
        let lastShowDelay = 0;

        titles.forEach((title) => {
          const chars = title.querySelectorAll(".char");

          void chars[0]?.offsetHeight;

          chars.forEach((el, i) => {
            const d = accumulatedDelay + i * 50 + 16;
            lastShowDelay = Math.max(lastShowDelay, d);

            setTimeout(() => {
              el.style.transform = "translateY(0%)";
              el.style.opacity = "1";
            }, d);
          });

          accumulatedDelay += chars.length * 50 + 200;

          const hideAfterMs = lastShowDelay + 700 + 3000;

          setTimeout(() => {
            let hideDelay = 0;

            [...titles].reverse().forEach((title) => {
              const chars = [...title.querySelectorAll(".char")].reverse();

              chars.forEach((el, i) => {
                const d = hideDelay + i * 50 + 16;

                setTimeout(() => {
                  el.style.transform = "translateY(120%)";
                  el.style.opacity = "0";
                }, d);
              });

              hideDelay += chars.length * 50 + 200;
            });
          }, hideAfterMs);
        });

        freezeWindow(false);
      }, 50);
    });
    startApp();
  };

  const sliderIntroduction = () => {
    const sliders = document.querySelectorAll(".js-slider-introduction");
    if (!sliders.length) return;

    sliders.forEach((slider) => {
      const sliderThumbnailsDOM = slider.querySelector(
        '.swiper[data-slider-role="slider-thumbnails"]',
      );
      const sliderMainDOM = slider.querySelector(
        '.swiper[data-slider-role="slider-main"]',
      );

      if (!sliderThumbnailsDOM || !sliderMainDOM) return;

      const sliderThumbnailsWrapper =
        sliderThumbnailsDOM.querySelector(".swiper-wrapper");
      sliderThumbnailsWrapper.innerHTML = "";
      const slideMainSlides = sliderMainDOM.querySelectorAll(".swiper-slide");
      slideMainSlides.forEach((slide) => {
        const thumbnail = slide.querySelector(".thumbnail-introduction img");
        if (thumbnail) {
          const nextThumbSrc = thumbnail.dataset.nextThumb || thumbnail.src;
          const thumbnailItem = document.createElement("div");
          thumbnailItem.className = "swiper-slide";
          thumbnailItem.innerHTML = `<figure><img class="object-common" src="${nextThumbSrc}" alt="${thumbnail.alt || ""}" /></figure>`;
          sliderThumbnailsWrapper.appendChild(thumbnailItem);
        }
      });

      const sliderThumbnails = new Swiper(sliderThumbnailsDOM, {
        loop: true,
        speed: 500,
        direction: "vertical",
        slidesPerView: 1,
        spaceBetween: 0,
        allowTouchMove: false,
        slideToClickedSlide: false,
        simulateTouch: false,
        keyboard: false,
        mousewheel: false,
      });

      const sliderMain = new Swiper(sliderMainDOM, {
        loop: true,
        speed: 1500,
        slidesPerView: 1,
        spaceBetween: 0,
        effect: "fade",
        fadeEffect: {
          crossFade: true,
        },
        pagination: {
          el: slider.querySelector('[data-slider-role="pagination"]'),
          clickable: true,
          type: "fraction",
          renderFraction: function (currentClass, totalClass) {
            return `<span class="${currentClass}" data-slider-role="pagination-current"></span>
                  <span class="${totalClass}" data-slider-role="pagination-total"></span>`;
          },
        },
        navigation: {
          nextEl: slider.querySelector('[data-slider-role="arrow-next"]'),
        },
      });

      sliderMain.on("realIndexChange", () => {
        sliderThumbnails.slideToLoop(sliderMain.realIndex);
      });
    });
  };

  const scrollPage = () => {
    const $header = $("header.header-common");
    let lastScroll = window.scrollY;

    const onScroll = () => {
      if (window.__APP_STATE__.forceHideHeader) return;
      if (document.body.style.position === "fixed") return;

      if (isDesktop() && window.__APP_STATE__?.sliderState?.active) {
        lastScroll = window.scrollY;
        $header.removeClass("is-hide");
        return;
      }

      const currentScroll = window.scrollY;

      if (currentScroll <= 0) {
        $header.removeClass("is-hide");
        lastScroll = 0;
        return;
      }

      if (currentScroll > lastScroll) {
        $header.addClass("is-hide");
      } else {
        $header.removeClass("is-hide");
      }

      lastScroll = currentScroll;
    };

    $(window).on("scroll", onScroll);
  };

  const triggerClick = () => {
    const classClickActive = 'is-click-active';

    const classClosing = 'is-closing';

    const header = document.querySelector('.header-common');

    const overlayMenu = document.querySelector('.overlay-menu');

    const navigationWrapper = document.querySelector('.navigation-wrapper');

    const clickElements = document.querySelectorAll('.js-click');

    const buttonClose = document.querySelector('.js-button-close');

    if (
      !header ||
      !overlayMenu ||
      !navigationWrapper ||
      !clickElements.length ||
      !buttonClose
    ) {
      return;
    }

    let isOpen = false;

    // OPEN
    const openMenu = (element) => {
      // RESET
      overlayMenu.classList.remove(classClosing);

      navigationWrapper.classList.remove(classClosing);

      clickElements.forEach((el) => {
        el.classList.remove(classClosing);
        el.classList.remove(classClickActive);
      });

      // Remove is-menu-closing → CSS transitions width 0 → 100%
      header.classList.remove('is-menu-closing');

      // ACTIVE
      header.classList.add('is-menu-open');
      element.classList.add(classClickActive);
      overlayMenu.classList.add(classClickActive);
      navigationWrapper.classList.add(classClickActive);

      // LOCK SCROLL
      document.body.style.overflow = 'hidden';
      // WinScroll.stop();
      freezeWindow(true);
      window.__APP_STATE__?.observer?.disable();

      isOpen = true;
    };

    // CLOSE
    const closeMenu = () => {
      isOpen = false;

      header.classList.add('is-menu-closing');

      overlayMenu.classList.remove(classClickActive);
      navigationWrapper.classList.remove(classClickActive);

      clickElements.forEach((el) => {
        el.classList.remove(classClickActive);
      });

      navigationWrapper.classList.add(classClosing);
      overlayMenu.classList.add(classClosing);

      clickElements.forEach((el) => {
        el.classList.add(classClosing);
      });

      setTimeout(() => {
        header.classList.remove('is-menu-open');

        header.classList.remove('is-menu-closing');

        overlayMenu.classList.remove(classClickActive, classClosing);

        navigationWrapper.classList.remove(classClickActive, classClosing);

        clickElements.forEach((el) => {
          el.classList.remove(classClickActive, classClosing);
        });

        document.body.style.overflow = '';
        freezeWindow(false);
        if (window.__APP_STATE__?.sliderState?.active) {
          window.__APP_STATE__?.observer?.enable();
        }
      }, 500);
    };

    window.addEventListener('header:close-menu', closeMenu);

    // TOGGLE
    clickElements.forEach((element) => {
      element.addEventListener('click', (e) => {
        e.stopPropagation();

        if (isOpen) {
          closeMenu();
        } else {
          openMenu(element);
        }
      });
    });

    // OVERLAY CLOSE
    overlayMenu.addEventListener('click', closeMenu);

    // BUTTON CLOSE
    buttonClose.addEventListener('click', closeMenu);
  };

  const fadeInAnimation = () => {
    const fadeInElements = document.querySelectorAll(".js-fadein");
    if (!fadeInElements.length) return;

    fadeInElements.forEach((element) => {
      gsap.fromTo(
        element, {
          opacity: 0,
          y: 50,
        }, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        },
      );
    });
  };

  const initMobileNavLinks = () => {
    if (isDesktop()) return;

    const mobileLinks = document.querySelectorAll(
      ".navigation-menu .item-link",
    );

    const getTargetSection = (hash) => {
      if (!hash) return null;
      return document.getElementById(hash);
    };

    mobileLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href") || "";
        const hash = href.split("#")[1];
        const linkPath = href.split("#")[0];

        // Links without a hash point to another page and must navigate normally.
        if (!hash) return;

        const isSamePage = !linkPath ||
          linkPath === window.location.pathname ||
          linkPath === window.location.origin + window.location.pathname ||
          linkPath.endsWith(window.location.pathname);

        if (!isSamePage) return;

        e.preventDefault();

        window.dispatchEvent(new CustomEvent("header:close-menu"));

        const target = getTargetSection(hash);
        if (target) {
          setTimeout(() => {
            target.scrollIntoView({
              behavior: "smooth",
            });
          }, 550);
        }
      });
    });

    const hash = window.location.hash?.replace("#", "");
    if (!hash) return;

    // Bỏ qua hash tabs (tab1, tab2...) - xử lý bởi initTabsFromHash
    if (/^tab\d+$/.test(hash)) return;

    const target = getTargetSection(hash);

    if (target) {
      setTimeout(() => {
        target.scrollIntoView({
          behavior: "smooth",
        });
        history.replaceState(null, "", window.location.pathname);
      }, 500);
    }
  };

  const measureAndAnimate = (el, wrapper, originalCount, speed, reverse) => {
    const allSlides = Array.from(wrapper.children);

    const firstSlide = allSlides[0];
    const firstOfSecondSet = allSlides[originalCount];

    const firstRect = firstSlide.getBoundingClientRect();
    const firstOfSecondRect = firstOfSecondSet.getBoundingClientRect();

    const oneSetWidth = firstOfSecondRect.left - firstRect.left;

    wrapper.style.willChange = "transform";
    wrapper.style.backfaceVisibility = "hidden";
    wrapper.style.webkitBackfaceVisibility = "hidden";

    const prefix = reverse ? "marquee-rev-px" : "marquee-px";
    const keyframeName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const style = document.createElement("style");

    style.textContent = reverse ?
      `@keyframes ${keyframeName} { from { transform: translate3d(-${oneSetWidth}px, 0, 0); } to { transform: translate3d(0, 0, 0); } }` :
      `@keyframes ${keyframeName} { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(-${oneSetWidth}px, 0, 0); } }`;
    document.head.appendChild(style);

    wrapper.style.width = "max-content";

    requestAnimationFrame(() => {
      wrapper.style.animation = `${keyframeName} ${speed}ms linear infinite`;
    });
  };

  const handleDarkBg = () => {
    if (window.innerWidth > mobileBreak) {
      document.documentElement.classList.remove("is-dark-bg");
      return;
    }

    const bgSections = Array.from(document.querySelectorAll(".js-bg"));

    document.documentElement.classList.toggle(
      "is-dark-bg",
      bgSections.some((sec) => {
        const {
          top,
          bottom
        } = sec.getBoundingClientRect();
        return top < window.innerHeight && bottom > 0;
      }),
    );
  };

  const sliderProjects = () => {
    const sliders = document.querySelectorAll(".js-top-projects");
    if (!sliders.length) return;

    sliders.forEach((container) => {
      const slider = container.querySelectorAll(".swiper")[0];

      new Swiper(slider, {
        loop: true,
        speed: 500,
        slidesPerView: 'auto',
        autoplay: {
          delay: 3000,
          disableOnInteraction: false,
        },
      });
    });
  };

  const dragGalleryImage = () => {
    const wrappers = document.querySelectorAll(".section-top-projects .projects-wrapper");
    if (!wrappers.length) return;

    const minVisibleWidth = 50;
    const maxVisibleWidth = 95;
    const isDragDesktop = () => window.innerWidth >= 1024.98;
    const clamp = (value) => Math.min(maxVisibleWidth, Math.max(minVisibleWidth, value));

    wrappers.forEach((wrapper) => {
      const image = wrapper.querySelector(".projects-image");
      if (!image) return;

      const setImageClip = (clientX) => {
        const rect = wrapper.getBoundingClientRect();
        const visibleWidth = clamp(((rect.right - clientX) / rect.width) * 100);
        const clipLeft = 100 - visibleWidth;
        wrapper.style.setProperty("--projects-image-clip-left", `${clipLeft}%`);
        image.classList.toggle("is-active", visibleWidth > minVisibleWidth);
      };

      image.addEventListener("pointerdown", (event) => {
        if (!isDragDesktop()) return;

        const rect = wrapper.getBoundingClientRect();
        const clipLeft = parseFloat(getComputedStyle(wrapper).getPropertyValue("--projects-image-clip-left")) || 50;
        const handleX = rect.left + (rect.width * clipLeft) / 100;
        const handleArea = Math.max(36, rect.width * 0.04);
        const isHandle = Math.abs(event.clientX - handleX) <= handleArea;
        if (!isHandle) return;

        event.preventDefault();
        image.classList.add("is-dragging");
        image.setPointerCapture?.(event.pointerId);
        setImageClip(event.clientX);

        const onPointerMove = (moveEvent) => {
          setImageClip(moveEvent.clientX);
        };

        const onPointerUp = () => {
          image.classList.remove("is-dragging");
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("pointerup", onPointerUp);
          window.removeEventListener("pointercancel", onPointerUp);
        };

        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerUp);
      });
    });
  };

  const partnersSlider = () => {
    const sliders = document.querySelectorAll('.js-relationship-slider');
    if (!sliders.length) return;

    sliders.forEach((slider) => {
      new Swiper(slider, {
        loop: true,
        speed: 1500,
        slidesPerView: 1,
        autoplay: {
          delay: 3000,
          disableOnInteraction: false
        },
        pagination: {
          el: '.swiper-pagination',
          clickable: true
        }
      });
    });
  };

  const galleryImagesSlider = (scope = document) => {
    const sliders = scope.matches?.('.js-gallery-images-slider') ?
      [scope] : scope.querySelectorAll('.js-gallery-images-slider');
    if (!sliders.length) return;

    sliders.forEach((slider) => {
      const tabPanel = slider.closest('.tab-panel');
      if (slider.swiper || (tabPanel && !tabPanel.classList.contains('active'))) return;

      const slideCount = slider.querySelectorAll('.swiper-slide').length;
      const minimumSlides = window.innerWidth >= 1025 ? 8 :
        window.innerWidth >= 768 ? 4 : 2;
      const canAutoplay = slideCount > minimumSlides;

      new Swiper(slider, {
        speed: 900,
        watchOverflow: true,
        slidesPerView: 2,
        slidesPerGroup: 2,
        spaceBetween: 20,
        grid: {
          rows: 1,
          fill: 'row',
        },
        pagination: {
          el: slider.querySelector('.swiper-pagination'),
          clickable: true,
        },
        autoplay: canAutoplay ? {
          delay: 3000,
          disableOnInteraction: false
        } : false,
        breakpoints: {
          768: {
            slidesPerView: 2,
            slidesPerGroup: 2,
            spaceBetween: 30,
            grid: {
              rows: 2,
              fill: 'row',
            },
          },
          1025: {
            slidesPerView: 4,
            slidesPerGroup: 4,
            spaceBetween: 30,
            grid: {
              rows: 2,
              fill: 'row',
            },
          },
        },
      });
    });
  };

  const galleryVideoSlider = () => {
    const sliders = document.querySelectorAll('.js-gallery-video-slider');
    if (!sliders.length) return;

    sliders.forEach((slider) => {
      new Swiper(slider, {
        loop: true,
        speed: 900,
        slidesPerView: 1,
        slidesPerGroup: 1,
        spaceBetween: 16,
        pagination: {
          el: slider.querySelector('.swiper-pagination'),
          clickable: true,
        },
        autoplay: {
          delay: 3000,
          disableOnInteraction: false
        },
        breakpoints: {
          768: {
            slidesPerView: 2,
            slidesPerGroup: 2,
            spaceBetween: 32,
          },
          1025: {
            slidesPerView: 2,
            slidesPerGroup: 2,
            spaceBetween: 48,
          },
        },
      });
    });
  };

  const projectsSectionSlider = () => {
    const sliders = document.querySelectorAll('.js-projects-slider');
    if (!sliders.length) return;

    sliders.forEach((slider) => {
      new Swiper(slider, {
        speed: 900,
        loop: true,
        slidesPerView: 1,
        slidesPerGroup: 1,
        spaceBetween: 20,
        pagination: {
          el: slider.querySelector('.swiper-pagination'),
          clickable: true,
        },
        autoplay: {
          delay: 3000,
          disableOnInteraction: false
        },
        breakpoints: {
          768: {
            slidesPerView: 2,
            slidesPerGroup: 2,
            spaceBetween: 28,
          },
          1025: {
            slidesPerView: 2,
            slidesPerGroup: 2,
            spaceBetween: 52,
          },
        },
      });
    });
  };

  const projectsUtilitiesSlider = () => {
    const sliders = document.querySelectorAll('.js-projects-utilities-slider');
    if (!sliders.length) return;

    sliders.forEach((slider) => {
      new Swiper(slider, {
        loop: true,
        speed: 1000,
        slidesPerView: 1,
        autoplay: {
          delay: 3500,
          disableOnInteraction: false,
        },
      });
    });
  };

  const recruitmentPositionSlider = () => {
    const sliders = document.querySelectorAll('.js-recruitment-position-slider');
    if (!sliders.length) return;

    sliders.forEach((slider) => {
      if (slider.swiper) return;

      const slideCount = slider.querySelectorAll('.swiper-wrapper > .swiper-slide').length;
      const hasFewSlides = slideCount <= 2;
      slider.classList.toggle('is-centered', hasFewSlides);

      new Swiper(slider, {
        loop: !hasFewSlides,
        loopAdditionalSlides: 5,
        loopPreventsSliding: false,
        speed: 700,
        slidesPerView: 'auto',
        slidesPerGroup: 1,
        centerInsufficientSlides: true,
        spaceBetween: 16,
        grabCursor: !hasFewSlides,
        roundLengths: true,
        watchSlidesProgress: true,
        breakpoints: {
          768: {
            spaceBetween: 20,
          },
          1025: {
            spaceBetween: 25,
          },
        },
      });
    });
  };

  const recruitmentFileInput = () => {
    const wrappers = document.querySelectorAll('.recruitment-apply-file');
    if (!wrappers.length) return;

    wrappers.forEach((wrapper) => {
      const input = wrapper.querySelector('input[type="file"]');
      const fileName = wrapper.querySelector('.recruitment-apply-file-name');
      if (!input || !fileName) return;

      input.addEventListener('change', () => {
        const name = input.files?.[0]?.name || 'Chọn CV';
        fileName.textContent = name;
        fileName.title = input.files?.[0]?.name || '';
      });
    });
  };

  const projectsDetailScroll = () => {
    const sections = document.querySelectorAll('.js-projects-detail-scroll');
    if (!sections.length || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    sections.forEach((section) => {
      const track = section.querySelector('.js-projects-detail-track');
      const viewport = section.querySelector('.projects-detail-sticky');
      const panels = section.querySelectorAll('.projects-detail-panel');
      if (!track || !viewport) return;

      const revealPanel = (panel, scrollTrigger, paused = false) => {
        const targets = panel.querySelectorAll('.js-projects-detail-reveal');
        if (!targets.length) return null;

        return gsap.fromTo(targets, {
          autoAlpha: 0,
          y: 32,
        }, {
          autoAlpha: 1,
          y: 0,
          duration: 1.4,
          stagger: .2,
          ease: 'power2.out',
          scrollTrigger,
          paused,
        });
      };

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        section.classList.add('is-reduced-motion');
        return;
      }

      if (!window.matchMedia('(min-width: 1025px)').matches) {
        section.classList.add('is-static');
        gsap.set(track, { clearProps: 'transform' });
        panels.forEach((panel) => {
          revealPanel(panel, {
            trigger: panel,
            start: 'top 82%',
            toggleActions: 'play none none reverse',
          });
        });
        return;
      }

      gsap.set(track, { x: 0 });
      const revealAnimations = Array.from(panels, (panel) => revealPanel(panel, null, true));
      const revealedPanels = new Set();

      const showPanel = (index) => {
        if (revealedPanels.has(index)) return;
        revealedPanels.add(index);
        revealAnimations[index]?.play();
      };

      const scrollTween = gsap.to(track, {
        x: () => -Math.max(0, track.scrollWidth - window.innerWidth),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${Math.max(1, track.scrollWidth - window.innerWidth)}`,
          scrub: 1.2,
          pin: viewport,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const index = Math.min(
              panels.length - 1,
              Math.round(self.progress * (panels.length - 1))
            );
            showPanel(index);
          },
        },
      });

      showPanel(0);
    });
  };

  const initTabs = () => {
    const tabsWrappers = document.querySelectorAll('.js-tabs, .list-news-tabs');
    if (!tabsWrappers.length) return;

    tabsWrappers.forEach((wrapper) => {
      const buttons = wrapper.querySelectorAll('.tab-btn');
      const panels = wrapper.querySelectorAll('.tab-panel');
      if (!buttons.length || !panels.length) return;

      let isAnimating = false;

      const activateTab = (targetId) => {
        const targetPanel = wrapper.querySelector(`#panel-${targetId}`);
        if (!targetPanel) return;

        buttons.forEach((btn) =>
          btn.classList.toggle('active', btn.dataset.tab === targetId)
        );

        panels.forEach((panel) => {
          if (panel === targetPanel) {
            panel.classList.add('active');
            galleryImagesSlider(targetPanel);
            gsap.fromTo(
              panel, {
                autoAlpha: 0,
                y: 30
              }, {
                autoAlpha: 1,
                y: 0,
                duration: 0.6,
                ease: 'power2.out',
                onComplete: () => {
                  targetPanel.querySelectorAll('.swiper').forEach((element) => {
                    if (element.swiper && !element.swiper.destroyed) {
                      element.swiper.update();
                    }
                  });
                  isAnimating = false;
                },
              }
            );
          } else {
            panel.classList.remove('active');
          }
        });
      };

      buttons.forEach((button) => {
        button.addEventListener('click', () => {
          if (isAnimating) return;
          const targetId = button.dataset.tab;
          if (!targetId) return;
          if (button.classList.contains('active')) return;
          isAnimating = true;
          activateTab(targetId);
        });
      });

      wrapper.__activateTab = activateTab;
    });
  };

  const initPolicyAccordion = () => {
    const accordions = document.querySelectorAll('.js-policy-accordion');
    if (!accordions.length) return;

    accordions.forEach((accordion) => {
      const items = accordion.querySelectorAll('.policy-accordion-item');
      let scrollTimer;

      items.forEach((item) => {
        const button = item.querySelector('.policy-accordion-button');
        const content = item.querySelector('.policy-accordion-content');
        if (!button || !content) return;

        button.addEventListener('click', () => {
          const shouldOpen = !item.classList.contains('is-active');

          items.forEach((currentItem) => {
            const currentButton = currentItem.querySelector('.policy-accordion-button');
            const isCurrent = currentItem === item && shouldOpen;

            currentItem.classList.toggle('is-active', isCurrent);
            currentButton?.setAttribute('aria-expanded', String(isCurrent));
          });

          clearTimeout(scrollTimer);
          if (!shouldOpen) return;

          scrollTimer = setTimeout(() => {
            const header = document.querySelector('header');
            const headerOffset = header?.getBoundingClientRect().height || 0;
            const top = window.scrollY + item.getBoundingClientRect().top - headerOffset - 16;

            window.scrollTo({
              top: Math.max(0, top),
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            });
          }, 460);
        });
      });
    });
  };

  const initTabsFromHash = () => {
    const applyHash = () => {
      const hash = window.location.hash?.replace('#', '');
      if (!hash) return;
      if (!/^tab\d+$/.test(hash)) return;

      history.replaceState(null, '', window.location.pathname + window.location.search);

      const tabsWrappers = document.querySelectorAll('.js-tabs, .list-news-tabs');
      if (!tabsWrappers.length) return;

      tabsWrappers.forEach((wrapper) => {
        const targetButton = Array.from(
          wrapper.querySelectorAll('.tab-btn')
        ).find((btn) => btn.dataset.tab === hash);
        if (!targetButton) return;

        targetButton.click();

        setTimeout(() => {
          wrapper.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }, 300);
      });
    };

    applyHash();

    window.addEventListener('hashchange', applyHash);
  };

  const initPanelZoomAnimation = () => {
    const panels = [...document.querySelectorAll('.panel')].filter((panel) =>
      panel.querySelector('.ani-zoom')
    );
    if (!panels.length) return;

    panels.forEach((panel) => {
      const restart = () => {
        panel.querySelectorAll('.ani-zoom').forEach((element) => {
          element.style.animation = 'none';
          void element.offsetWidth;
          element.style.animation = '';
        });
      };

      let wasActive = panel.classList.contains('is-active');
      const observer = new MutationObserver(() => {
        const isActive = panel.classList.contains('is-active');
        if (isActive && !wasActive) restart();
        wasActive = isActive;
      });

      observer.observe(panel, {
        attributes: true,
        attributeFilter: ['class'],
      });

      if (wasActive) restart();
    });
  };

  const sliderGalleryDetail = (scope = document) => {
    const sliders = scope.querySelectorAll(".js-slider-gallery-detail");
    if (!sliders.length) return;

    sliders.forEach((container) => {
      const slider = container.querySelector(".swiper");
      const sliderTitle = container.querySelector(".swiper-title");
      if (!slider || slider.swiper) return;

      const updateTitle = (swiper) => {
        const activeSlide = swiper.slides[swiper.activeIndex];
        if (sliderTitle && activeSlide) {
          sliderTitle.textContent = activeSlide.dataset.title || "";
        }
      };

      new Swiper(slider, {
        loop: true,
        speed: 500,
        slidesPerView: 1,
        navigation: {
          nextEl: slider.querySelector(".swiper-button-next"),
          prevEl: slider.querySelector(".swiper-button-prev"),
        },
        pagination: {
          el: slider.querySelector(".swiper-pagination"),
          type: "fraction",
        },
        on: {
          init: updateTitle,
          slideChange: updateTitle,
        },
      });
    });
  };

  const createPopup = ({
    id,
    className = "",
    hasTitle = true
  }) => {
    if (document.getElementById(id)) return;

    const popup = document.createElement("div");
    popup.id = id;
    popup.className = `media-popup ${className}`;

    popup.innerHTML = `
      <div class="popup-overlay"></div>
      <div class="popup-box">
        <button class="popup-close trans js-close-popup"></button>
        <div class="popup-body" id="${id}-body"></div>
      </div>
    `;

    document.body.appendChild(popup);
  };

  const initPopup = () => {
    const media = getPopupElements("mediaPopup");
    const premises = getPopupElements("premisesPopup");
    const premisesDetail = getPopupElements("premisesDetailPopup");
    const $header = $("header.header-common");
    if (!$header.length || !media) return;

    const openTriggers = document.querySelectorAll(".js-open-popup");
    let currentPopup = null;
    const popupStack = [];

    const open = (popupId) => {
      const popupEl = getPopupElements(popupId);
      if (!popupEl) return;

      const {
        popup
      } = popupEl;

      // Nếu popup này chưa có trong stack thì thêm vào
      if (!popupStack.includes(popup)) {
        popupStack.push(popup);
      }

      currentPopup = popup;

      $header.removeClass("is-hide");
      document.body.style.overflow = "hidden";
      freezeWindow(true);

      window.__APP_STATE__?.observer?.disable();

      setTimeout(() => {
        popup.classList.add("active");
      }, 300);
    };

    const close = (popup) => {
      if (!popup) return;

      popup.classList.remove("active");

      // Xóa HTML động tương ứng
      if (popup === media?.popup) {
        media.body.innerHTML = "";
      }

      if (popup === premises?.popup) {
        premises.body.innerHTML = "";
      }

      if (popup === premisesDetail?.popup) {
        premisesDetail.body.innerHTML = "";
      }

      // Xóa popup khỏi stack
      const index = popupStack.indexOf(popup);

      if (index !== -1) {
        popupStack.splice(index, 1);
      }

      // Lấy popup trước đó
      currentPopup = popupStack[popupStack.length - 1] || null;

      // Nếu vẫn còn popup trước đó
      if (currentPopup) {
        currentPopup.classList.add("active");
        return;
      }

      // Không còn popup nào
      document.body.style.overflow = "";
      freezeWindow(false);

      if (window.__APP_STATE__?.sliderState?.active) {
        window.__APP_STATE__?.observer?.enable();
      }
    };

    // Mở popup
    openTriggers.forEach((trigger) => {
      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        const popupId = trigger.dataset.popup;
        if (!popupId) return;
        open(popupId);
      });
    });

    // Đóng popup
    document.addEventListener("click", (e) => {
      if (!currentPopup) return;

      if (e.target.closest(".js-close-popup")) {
        close(currentPopup);
        return;
      }

      if (e.target.closest(".popup-wrapper, .popup-box")) {
        return;
      }

      if (e.target === currentPopup) {
        close(currentPopup);
        return;
      }

      const backdrop = currentPopup.querySelector(":scope > .popup-overlay");
      if (backdrop && e.target === backdrop) {
        close(currentPopup);
      }
    });

    // Đóng bằng phím Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && currentPopup) {
        close(currentPopup);
      }
    });

    document.addEventListener("click", async (e) => {
      const slide = e.target.closest(".js-slide-image");
      const video = e.target.closest(".js-slide-video");
      const premisesItem = e.target.closest(".js-premises-item");
      const premisesDetailItem = e.target.closest(".js-premises-detail-item");

      if (slide && media) {
        const {
          body,
          title
        } = media;
        const images = JSON.parse(slide.dataset.gallery || "[]");
        if (!images.length) return;

        const slideItems = images
          .map(
            (img) => `
          <div class="swiper-slide" data-title="${img.alt}">
            <div class="slide-wrapper">
              <div class="slide-image">
                <img class="object-common" src="${img.url}" alt="${img.alt}"
                  loading="eager" width="${img.w}" height="${img.h}" />
              </div>
            </div>
          </div>`
          )
          .join("");

        body.innerHTML = `
          <section class="section-gallery">
            <div class="wrapper">
              <div class="list-top-gallery-detail js-slider-gallery-detail">
                <div class="swiper">
                  <div class="swiper-wrapper">${slideItems}</div>
                  <div class="swiper-button-prev trans"></div>
                  <div class="swiper-button-next trans"></div>
                  <div class="swiper-controller">
                    <div></div>
                    <p class="swiper-title">${slide.dataset.title || ""}</p>
                    <div class="swiper-pagination"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>`;

        open(media.popup.id);
        if (window.Swiper) {
          setTimeout(() => sliderGalleryDetail(body), 350);
        }
        return;
      }

      if (video && media) {
        const {
          body,
          title
        } = media;
        const url = video.dataset.url;
        const poster = video.dataset.poster;
        open(media.popup.id);

        const mediaContent = url ? (() => {
          const finalUrl = url.includes("?") ?
            url + "&autoplay=1&mute=1" :
            url + "?autoplay=1&mute=1";

          return `<iframe class="object-common"
            src="${finalUrl}"
            allow="autoplay; encrypted-media"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen>
          </iframe>`;
        })() : `<img class="object-common" src="${poster || ''}"
          alt="${video.dataset.title || ''}" loading="eager" />`;

        body.innerHTML = `
            <section class="section-gallery">
              <div class="wrapper">
                <div class="list-top-gallery-detail">
                  <div class="slide-video yt-iframe-wrap">
                    ${mediaContent}
                  </div>
                </div>
                <div class="swiper-controller">
                  <p class="swiper-title">${video.dataset.title || ""}</p>
                </div>
              </div>
            </section>
          `;
        return;
      }

      if (premisesItem && premises) {
        const {
          body
        } = premises;

        open("premisesPopup");
        body.innerHTML = "Loading...";

        try {
          const html = await (await fetch(premisesItem.dataset.url)).text();
          body.innerHTML = html;
          initProductsTopSlider(body);
          hoverApartment(body);
        } catch {
          body.innerHTML = "Load failed";
        }
      }

      if (premisesDetailItem && premisesDetail) {
        const url = premisesDetailItem.dataset.url;
        if (!url) return;

        const {
          body
        } = premisesDetail;

        open("premisesDetailPopup", {
          lock: false,
        });
        body.innerHTML = "Loading...";

        try {
          body.innerHTML = await (await fetch(url)).text();
        } catch {
          body.innerHTML = "Load failed";
        }
      }
    });
  };

  window.WebFontConfig = {
    custom: {
      families: [
        "Montserrat:n3,n4,n5,n6,n7",
      ],
      urls: [
        "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap",
      ],
    },
  };

  (() => {
    const wf = document.createElement("script");
    wf.src = "https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js";
    wf.type = "text/javascript";
    wf.async = "true";
    const s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(wf, s);
  })();

  detectDevice();
  initIntro();
  initContactPopup();
  triggerClick();
  fadeInAnimation();
  scrollPage();
  initPanelZoomAnimation();
  initMobileNavLinks();
  slideKeyvisual();
  window.addEventListener("scroll", handleDarkBg, {
    passive: true
  });
  sliderProjects();
  dragGalleryImage();
  partnersSlider();
  galleryImagesSlider();
  galleryVideoSlider();
  projectsSectionSlider();
  projectsUtilitiesSlider();
  recruitmentPositionSlider();
  recruitmentFileInput();
  projectsDetailScroll();
  initTabs();
  initPolicyAccordion();
  initTabsFromHash();
  createPopup({
    id: "mediaPopup",
  });
  createPopup({
    id: "premisesPopup",
    hasTitle: false,
  });
  initPopup();
})();
