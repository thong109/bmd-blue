"use strict";

(() => {
  let __scrollY = 0;
  let __normalScrollY = 0;
  const isDesktop = () => window.innerWidth >= 1024.98;
  const tabletBreak = 1280;
  const mobileBreak = 767.98;
  const mobileXSBreak = 414;

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
    const headings = panels.map((p) => Array.from(p.querySelectorAll(".hero-title")).filter(Boolean));
    const subs = panels.map((p) => Array.from(p.querySelectorAll(".hero-sub")).filter(Boolean));
    const stage = document.querySelector(".slider-stage");
    const navEl = document.getElementById("nav");
    const navItems = navEl.querySelectorAll(".nav-item");
    const headerLogo = document.getElementById("logo-primary");

    if (
      !headerLogo ||
      !navEl ||
      !stage ||
      !navItems.length ||
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
        n.classList.toggle("active", j === i && j < SLIDER_COUNT),
      );

    const updateNavByTarget = (targetId) =>
      navItems.forEach((n) =>
        n.classList.toggle("active", n.dataset.target === targetId),
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

    const mobileLinks = document.querySelectorAll(
      ".navigation-menu .item-link",
    );

    mobileLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();

        const navigation = document.querySelector(".header-common-navigation");
        document
          .querySelectorAll(".js-click")
          .forEach((el) => el.classList.remove("is-click-active"));
        navigation?.classList.remove("is-click-active");
        freezeWindow(false);

        const hash = (link.getAttribute("href") || "").split("#")[1];
        const navItem = Array.from(navItems).find(
          (item) => item.dataset.target === hash,
        );
        if (!navItem) return;

        setTimeout(() => {
          if (s.active) {
            observer?.enable();
          }

          navItem.click();
        }, 300);
      });
    });

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
            gsap.set(h, { autoAlpha: 1, yPercent: 0 }),
          );
        if (subs[i]?.length)
          subs[i].forEach((sub) =>
            gsap.set(sub, { autoAlpha: 1, yPercent: 0 }),
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
            if (el.swiper) el.swiper.update();
          });
          cb?.();
        },
      });

      if (prev >= 0) {
        gsap.set(panels[s.cur], {
          zIndex: 0,
        });

        if (images[s.cur]) {
          tl.to(
            images[s.cur],
            {
              yPercent: -14 * d,
            },
            0,
          );
        }
      }

      const curTargets = [outers[i], inners[i]].filter(Boolean);
      if (curTargets.length) {
        tl.fromTo(
          curTargets,
          {
            yPercent: (j) => (j ? -100 * d : 100 * d),
            immediateRender: false,
          },
          {
            yPercent: 0,
          },
          0,
        );
      }

      if (images[i]) {
        tl.fromTo(
          images[i],
          {
            yPercent: 14 * d,
          },
          {
            yPercent: 0,
          },
          0,
        );
      }

      if (headings[i]?.length) {
        headings[i].forEach((h, j) => {
          tl.fromTo(
            h,
            {
              autoAlpha: 0,
              yPercent: 200 * d,
            },
            {
              autoAlpha: 1,
              yPercent: 0,
              duration: 0.9,
              ease: "power2.out",
            },
            0.18,
          );
        });
      }

      if (subs[i]?.length) {
        subs[i].forEach((sub, j) => {
          tl.fromTo(
            sub,
            {
              autoAlpha: 0,
              yPercent: 200 * d,
            },
            {
              autoAlpha: 1,
              yPercent: 0,
              duration: 0.8,
              ease: "power2.out",
            },
            0.28,
          );
        });
      }

      s.cur = i;
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
      document.documentElement.classList.remove("is-dark-bg");
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
            p.classList.toggle("is-active", idx === target),
          );
          updateLogo(target);
          observer?.enable();
          onDone?.();

          setTimeout(() => {
            window.dispatchEvent(new Event("scroll"));
          }, 50);
        },
      });
    };

    /* ---------------- OBSERVER (DESKTOP ONLY) ---------------- */
    let observer = null;

    const initObserver = () => {
      if (isTablet()) return;

      observer = Observer.create({
        type: "wheel,touch",
        wheelSpeed: -1,
        tolerance: 14,
        preventDefault: true,

        onDown: (self) => {
          if (!s.animating && s.active && !s.switching) {
            goto(s.cur - 1, -1);
          }
        },

        onUp: (self) => {
          if (!s.animating && s.active && !s.switching) {
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

        history.replaceState(null, "", window.location.pathname);

        const matchedNavItem = Array.from(navItems).find(
          (item) => item.dataset.target === hash,
        );

        setTimeout(() => {
          if (matchedNavItem) {
            matchedNavItem.click();
          } else {
            const target = document.getElementById(hash);
            if (!target) return;
            if (s.active) {
              release(() =>
                target.scrollIntoView({
                  behavior: "smooth",
                }),
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
        }),
      );
    }

    const sectionIds = Array.from(navItems)
      .map((n) => n.dataset.target)
      .filter(Boolean);

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (sections.length) {
      const scrollSections = sections.filter(
        (sec) => !sec.classList.contains("panel"),
      );
      const bgSections = scrollSections.filter((sec) =>
        sec.classList.contains("js-bg"),
      );

      const updateDarkBg = () => {
        if (window.__APP_STATE__?.sliderState?.active) {
          document.documentElement.classList.remove("is-dark-bg");
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

  const sliderGallery = () => {
    const sliders = document.querySelectorAll(".js-slider-gallery");
    if (!sliders.length) return;

    sliders.forEach((container) => {
      const slider = container.querySelector(".swiper");
      const wrapper = slider.querySelector(".swiper-wrapper");

      const count = wrapper.querySelectorAll(".swiper-slide").length;
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      const perView = isMobile ? 1 : 2 + 356 / 712;
      const shouldLoop = count > Math.ceil(perView);

      new Swiper(slider, {
        loop: shouldLoop,
        speed: 500,
        slidesPerView: perView,
        spaceBetween: isMobile ? 10 : 30,
        centeredSlides: false,
        initialSlide: 0,
        autoplay: {
          delay: 3000,
        },
        pagination: {
          el: container.querySelector(".swiper-pagination"),
          clickable: true,
        },
      });
    });
  };

  const tabsGallery = (scope = document) => {
    const tabs = scope.querySelectorAll(".js-tabs");
    if (!tabs.length) return;

    tabs.forEach((tab) => {
      const buttons = tab.querySelectorAll(".tab-btn");

      buttons.forEach((btn) => {
        if (btn.dataset.tabsBound === "true") return;
        btn.dataset.tabsBound = "true";

        btn.addEventListener("click", () => {
          const target = btn.dataset.tab;
          const nextPanel = tab.querySelector(`#${target}`);

          if (!nextPanel || btn.classList.contains("active")) return;

          buttons.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");

          const currentPanel = tab.querySelector(".tab-panel.active");
          if (currentPanel) {
            gsap.to(currentPanel, {
              autoAlpha: 0,
              duration: 0.2,
              ease: "power1.inOut",
              onComplete: () => {
                currentPanel.classList.remove("active");
                nextPanel.classList.add("active");
                gsap.fromTo(
                  nextPanel,
                  {
                    autoAlpha: 0,
                  },
                  {
                    autoAlpha: 1,
                    duration: 0.25,
                    ease: "power1.out",
                  },
                );
              },
            });
          } else {
            nextPanel.classList.add("active");
            gsap.fromTo(
              nextPanel,
              {
                autoAlpha: 0,
              },
              {
                autoAlpha: 1,
                duration: 0.25,
                ease: "power1.out",
              },
            );
          }
        });
      });
    });
  };

  const createPopup = ({ id, className = "", hasTitle = true }) => {
    if (document.getElementById(id)) return;

    const popup = document.createElement("div");
    popup.id = id;
    popup.className = `media-popup ${className}`;

    popup.innerHTML = `
      <div class="popup-overlay"></div>
      <div class="popup-box">
        <button class="popup-close trans"></button>
        <div class="popup-body" id="${id}-body"></div>
        ${hasTitle
        ? `<div class="wrapper">
                <h3 class="popup-title" id="${id}-title"></h3>
              </div>`
        : ""
      }
      </div>
    `;

    document.body.appendChild(popup);
  };

  // Helper

  const freezeWindow = (lock) => {
    const normalScroll = document.querySelector(".normal-scroll");

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

  const initMobileAnimations = () => {
    if (isDesktop()) return;

    gsap.registerPlugin(ScrollTrigger);

    const targets = document.querySelectorAll(".js-title");
    if (!targets.length) return;

    targets.forEach((el) => {
      gsap.fromTo(
        el,
        {
          autoAlpha: 0,
          y: 100,
        },
        {
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
  // End helper

  const initUtilitiesPairs = () => {
    const popup = document.getElementById("utilitiesPopup");
    if (!popup) return;
    const pairItems = popup.querySelectorAll("[data-pair]");
    if (!pairItems.length) return;

    const toggle = document.createElement("div");
    toggle.className = "utilities-map-toggle";
    toggle.innerHTML = `
    <figure class="toggle-image">
      <img class="toggle-img object-common" src="" alt="" loading="lazy">
    </figure>
    <span class="toggle-text"></span>
  `;

    const getActiveContainer = (panel) => {
      const md = panel?.querySelector(".md");
      const sm = panel?.querySelector(".sm");
      if (md && getComputedStyle(md).display !== "none") return md;
      if (sm && getComputedStyle(sm).display !== "none") return sm;
      return md || sm;
    };

    const getPairContent = (pair, source) => {
      const panel =
        source?.closest(".tab-panel") ||
        popup.querySelector(".tab-panel.active");
      const item =
        source?.closest(".utilities-list .list-item") ||
        panel?.querySelector(
          `.utilities-list .list-item[data-pair="${pair}"]`,
        ) ||
        popup.querySelector(`.utilities-list .list-item[data-pair="${pair}"]`);
      return {
        image: item?.dataset.image || source?.dataset.image || "",
        text: item?.querySelector(".content-text")?.textContent?.trim() || "",
      };
    };

    const positionToggle = (source, pair) => {
      const panel =
        source?.closest(".tab-panel") ||
        popup.querySelector(".tab-panel.active");
      const popupImage =
        panel?.querySelector(".popup-image") ||
        popup.querySelector(".popup-image");

      const activeContainer = getActiveContainer(
        panel || popupImage?.closest(".tab-panel"),
      );

      const isFromSvg = source?.closest(".popup-path");
      const svgContainer = isFromSvg
        ? source?.closest(".md, .sm")
        : activeContainer;

      const target = isFromSvg
        ? source
        : svgContainer?.querySelector(`.popup-path [data-pair="${pair}"]`) ||
        activeContainer?.querySelector(`.popup-path [data-pair="${pair}"]`);

      const imageWrapper = svgContainer?.closest(".popup-image") || popupImage;
      if (!imageWrapper || !target) return;
      if (toggle.parentNode !== imageWrapper) imageWrapper.appendChild(toggle);

      const imageRect = imageWrapper.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      toggle.style.left = `${targetRect.left - imageRect.left + targetRect.width / 2}px`;
      toggle.style.top = `${targetRect.top - imageRect.top + targetRect.height / 2}px`;
    };

    const setActivePair = (pair, source) => {
      pairItems.forEach((item) => {
        item.classList.toggle("is-active", item.dataset.pair === pair);
      });
      toggle.classList.toggle("is-active", Boolean(pair));

      if (pair) {
        const content = getPairContent(pair, source);
        const toggleFigure = toggle.querySelector(".toggle-image"); // Chọn thẻ khung figure
        const toggleImage = toggle.querySelector(".toggle-img");
        const toggleText = toggle.querySelector(".toggle-text");

        if (content.image) {
          // Nếu có hình ảnh (thumb != false)
          toggleFigure.style.display = ""; // Hiển thị lại khung
          toggleImage.src = content.image;
          toggleImage.alt = content.text;
        } else {
          // Nếu không có hình ảnh
          toggleFigure.style.display = "none"; // Ẩn hoàn toàn khung
          toggleImage.src = "";
        }

        if (toggleText) toggleText.textContent = content.text;
        positionToggle(source, pair);
      }
    };

    pairItems.forEach((item) => {
      item.addEventListener("mouseenter", () =>
        setActivePair(item.dataset.pair, item),
      );
      item.addEventListener("mouseleave", () => setActivePair(""));
    });

    popup.querySelectorAll(".tab-btn").forEach((button) => {
      button.addEventListener("click", () => setActivePair(""));
    });
  };

  const initPopup = () => {
    const media = getPopupElements("mediaPopup");
    const premises = getPopupElements("premisesPopup");
    const premisesDetail = getPopupElements("premisesDetailPopup");
    const contact = getPopupElements("contactPopup");
    const utilities = getPopupElements("utilitiesPopup");
    const header = document.querySelector("header.header-common");

    if (
      !media ||
      !premises ||
      !premisesDetail ||
      !contact ||
      !utilities ||
      !header
    )
      return;

    const openPopup = (instance, { lock = true } = {}) => {
      instance.popup.classList.add("active");

      window.__APP_STATE__.forceHideHeader = true;

      if (!isDesktop()) {
        header.classList.add("is-hide");
      }

      if (lock) {
        freezeWindow(true);
        window.__APP_STATE__?.observer?.disable();
      }
    };

    const closePopup = (
      instance,
      { clearBody = true, releaseLock = true } = {},
    ) => {
      instance.popup.classList.remove("active");

      if (clearBody && instance.body) instance.body.innerHTML = "";
      if (instance.title) instance.title.textContent = "";

      if (!releaseLock) return;

      freezeWindow(false);

      window.__APP_STATE__.forceHideHeader = false;

      if (window.__APP_STATE__?.sliderState?.active) {
        window.__APP_STATE__?.observer?.enable();
      }

      setTimeout(() => {
        window.dispatchEvent(new Event("scroll"));
      }, 50);
    };

    document.addEventListener("click", async (e) => {
      const slide = e.target.closest(".js-slide-image");
      const video = e.target.closest(".js-gallery-video");
      const premisesItem = e.target.closest(".js-premises-item");
      const premisesDetailItem = e.target.closest(".js-premises-detail-item");
      const contactBtn = e.target.closest(".js-contact-btn");
      const utilitiesBtn = e.target.closest(".js-utilities-btn");

      if (contactBtn && contact) {
        openPopup(contact);
        return;
      }
      if (utilitiesBtn && utilities) {
        openPopup(utilities);
        return;
      }

      if (slide && media) {
        const { body, title } = media;

        title.textContent = slide.dataset.title || "";

        const images = JSON.parse(slide.dataset.gallery || "[]");
        if (!images.length) return;

        const slideItems = images
          .map(
            (img) => `
          <div class="swiper-slide">
            <div class="slide-wrapper">
              <div class="slide-image">
                <img class="object-common" src="${img.url}" alt="${img.alt}"
                  loading="eager" width="${img.w}" height="${img.h}" />
              </div>
            </div>
          </div>`,
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
                  <div class="swiper-pagination"></div>
                </div>
              </div>
            </div>
          </section>`;

        openPopup(media);
        if (window.Swiper) sliderGalleryDetail(body);
        return;
      }

      if (video && media) {
        const { body, title } = media;
        const url = video.dataset.url;
        title.textContent = video.dataset.title || "";
        openPopup(media);

        const finalUrl = url.includes("?")
          ? url + "&autoplay=1&mute=1"
          : url + "?autoplay=1&mute=1";

        body.innerHTML = `
            <section class="section-gallery">
              <div class="wrapper">
                <div class="list-top-gallery-detail">
                  <div class="slide-video yt-iframe-wrap">
                    <iframe class="object-common"
                      src="${finalUrl}"
                      allow="autoplay; encrypted-media"
                      allowfullscreen>
                    </iframe>
                  </div>
                </div>
              </div>
            </section>
          `;
        return;
      }

      if (premisesItem && premises) {
        const { body } = premises;

        openPopup(premises);
        body.innerHTML = "Loading...";

        try {
          const html = applyPremisesI18n(
            await (await fetch(premisesItem.dataset.url)).text(),
          );
          body.innerHTML = html;
          hoverApartment(body);
        } catch {
          body.innerHTML = "Load failed";
        }
      }

      if (premisesDetailItem && premisesDetail) {
        const url = premisesDetailItem.dataset.url;
        if (!url) return;

        const { body } = premisesDetail;

        openPopup(premisesDetail, {
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

    const bindClose = (instance, options = {}) => {
      if (!instance) return;
      const close = () => closePopup(instance, options);
      instance.closeBtn.onclick = close;
      instance.overlay.onclick = close;
    };

    bindClose(media);
    bindClose(premises);
    bindClose(premisesDetail, {
      releaseLock: false,
    });
    bindClose(contact, {
      clearBody: false,
    });
    bindClose(utilities, {
      clearBody: false,
    });
  };

  const sliderGalleryDetail = (scope = document) => {
    const sliders = scope.querySelectorAll(".js-slider-gallery-detail");
    if (!sliders.length) return;

    sliders.forEach((container) => {
      const slider = container.querySelector(".swiper");
      if (!slider || slider.swiper) return;

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
      });
    });
  };

  const initIntro = () => {
    const intro = document.querySelector(".intro");
    if (!intro) return;
    
    const isTablet = () => window.innerWidth < 1024.98;
    
    if (!isTablet()) {
      document.body.style.overflow = "hidden";
    }
    
    setTimeout(() => {
      intro.classList.add("is-hidden");
      setTimeout(() => {
        if (!isTablet()) {
          document.body.style.overflow = "hidden";
        }
        const video = document.getElementById('video-element');
        if (video) {
          const playPromise = video.play();
          playPromise?.catch(() => console.warn('Autoplay blocked.'));
        }
        app();
        initMobileAnimations();
      }, 600);
    }, 1200);
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

  const toggleLocation = () => {
    const btn = document.querySelectorAll(".js-toggle-location");
    const locations = document.querySelectorAll(".js-location");

    if (!btn.length || !locations.length) return;

    let expanded = false;

    btn.forEach((button) => {
      button.addEventListener("click", () => {
        expanded = !expanded;
        locations.forEach((el) => {
          el.classList.toggle("expanded", expanded);
        });
      });
    });
  };

  const initMapZoom = () => {
    const mapWrapper = document.querySelector(".js-map");
    const zoomInBtn = document.querySelector(".map-controller .button-plus");
    const zoomOutBtn = document.querySelector(
      ".map-controller .button-negative",
    );

    if (!mapWrapper || !zoomInBtn || !zoomOutBtn) return;

    const MIN_ZOOM = 1.2;
    const MAX_ZOOM = 2;

    let currentZoom = 1.2;
    let translateX = 0;
    let translateY = 0;

    let isDragging = false;
    let startX = 0;
    let startY = 0;

    let rafId = null;

    const updateUI = () => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        if (currentZoom === 1.2) {
          translateX = 0;
          translateY = 0;
        }

        mapWrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;

        mapWrapper.classList.toggle("is-draggable", currentZoom > 1.2);

        zoomInBtn.classList.toggle("is-disabled", currentZoom >= MAX_ZOOM);
        zoomOutBtn.classList.toggle("is-disabled", currentZoom <= MIN_ZOOM);

        rafId = null;
      });
    };

    zoomInBtn.addEventListener("click", (e) => {
      e.preventDefault();
      currentZoom = Math.min(currentZoom + 0.5, MAX_ZOOM);
      updateUI();
    });

    zoomOutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      currentZoom = Math.max(currentZoom - 0.5, MIN_ZOOM);
      updateUI();
    });

    mapWrapper.addEventListener("mousedown", (e) => {
      if (currentZoom === 1.2) return;
      isDragging = true;
      startX = e.clientX / currentZoom - translateX;
      startY = e.clientY / currentZoom - translateY;
      mapWrapper.style.cursor = "grabbing";
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDragging || currentZoom === 1.2) return;
      translateX = e.clientX / currentZoom - startX;
      translateY = e.clientY / currentZoom - startY;
      updateUI();
    });

    window.addEventListener("mouseup", () => {
      isDragging = false;
      mapWrapper.style.cursor = currentZoom > 1.2 ? "grab" : "default";
    });

    mapWrapper.addEventListener("touchstart", (e) => {
      if (currentZoom === 1.2) return;
      const touch = e.touches[0];
      isDragging = true;
      startX = touch.clientX / currentZoom - translateX;
      startY = touch.clientY / currentZoom - translateY;
    });

    window.addEventListener(
      "touchmove",
      (e) => {
        if (!isDragging || currentZoom === 1.2) return;
        e.preventDefault();
        const touch = e.touches[0];
        translateX = touch.clientX / currentZoom - startX;
        translateY = touch.clientY / currentZoom - startY;
        updateUI();
      },
      {
        passive: false,
      },
    );

    window.addEventListener("touchend", () => {
      isDragging = false;
    });

    updateUI();
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
    const classClickActive = "is-click-active";
    const navigation = document.querySelector(".header-common-navigation");

    if (!navigation) return;

    document.querySelectorAll(".js-click").forEach((element) => {
      element.addEventListener("click", (e) => {
        e.stopPropagation();

        const isActive = element.classList.contains(classClickActive);

        document
          .querySelectorAll(".js-click")
          .forEach((el) => el.classList.remove(classClickActive));
        navigation.classList.remove(classClickActive);

        if (!isActive) {
          element.classList.add(classClickActive);
          navigation.classList.add(classClickActive);
          freezeWindow(true);
          window.__APP_STATE__?.observer?.disable();
        } else {
          freezeWindow(false);
          if (window.__APP_STATE__?.sliderState?.active) {
            window.__APP_STATE__?.observer?.enable();
          }
        }
      });
    });
  };

  const fadeInAnimation = () => {
    const fadeInElements = document.querySelectorAll(".js-fadein");
    if (!fadeInElements.length) return;

    fadeInElements.forEach((element) => {
      gsap.fromTo(
        element,
        {
          opacity: 0,
          y: 50,
        },
        {
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

  const initMarqueeSwiperMobile = () => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (!isMobile) return;

    const init = (selector, reverse = false) => {
      const elements = document.querySelectorAll(selector);
      if (!elements.length) return;

      elements.forEach((el) => {
        const wrapper = el.querySelector(".swiper-wrapper");
        if (!wrapper) return;

        const slides = wrapper.children;
        const minSlides = 10;

        if (slides.length < minSlides) {
          const cloneCount = Math.ceil(minSlides / slides.length);
          const html = wrapper.innerHTML;
          let newHTML = "";
          for (let i = 0; i < cloneCount; i++) {
            newHTML += html;
          }
          wrapper.innerHTML = newHTML;
        }

        const speed = Number(el.dataset.speed) || 10000;

        new Swiper(el, {
          autoplay: {
            delay: 1,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
            ...(reverse && {
              reverseDirection: true,
            }),
          },
          slidesPerView: "auto",
          speed: speed,
          resistance: true,
          resistanceRatio: 0,
          loop: true,
          allowTouchMove: false,
        });
      });
    };

    init(".js-marquee-carousel");
    init(".js-reverse-marquee-carousel", true);
  };

  const initMobileNavLinks = () => {
    if (isDesktop()) return;

    const mobileLinks = document.querySelectorAll(
      ".navigation-menu .item-link",
    );
    const navigation = document.querySelector(".header-common-navigation");

    const getTargetSection = (hash) => {
      if (!hash) return null;
      return document.getElementById(hash);
    };

    mobileLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href") || "";
        const hash = href.split("#")[1];
        const linkPath = href.split("#")[0];

        const isSamePage =
          !linkPath ||
          linkPath === window.location.pathname ||
          linkPath === window.location.origin + window.location.pathname ||
          linkPath.endsWith(window.location.pathname);

        if (!isSamePage) return;

        e.preventDefault();

        document
          .querySelectorAll(".js-click")
          .forEach((el) => el.classList.remove("is-click-active"));
        navigation?.classList.remove("is-click-active");
        freezeWindow(false);

        const target = getTargetSection(hash);
        if (target) {
          setTimeout(() => {
            target.scrollIntoView({
              behavior: "smooth",
            });
          }, 300);
        }
      });
    });

    const hash = window.location.hash?.replace("#", "");
    if (!hash) return;

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

  const hoverApartment = (container) => {
    const root = container || document;
    const panels = root.querySelectorAll(".tab-panel.js-hover-svg");
    if (!panels.length) return;

    panels.forEach((panel) => {
      if (panel.dataset.hoverBound) return;
      panel.dataset.hoverBound = "true";

      const premisesNotes = panel.querySelectorAll("svg.premises-note");
      const svgMain = premisesNotes[1] || premisesNotes[0];
      if (!svgMain) return;

      const noteDetail = svgMain.querySelector(".note-detail");
      const floorEl = svgMain.querySelector(".apartment-floor");
      const details = svgMain.querySelectorAll(".detail");
      const pendingMsg = svgMain.querySelector(".pending-msg");
      const pendingHideTargets = svgMain.querySelectorAll(
        ".note-detail .title, .note-detail .detail",
      );
      if (!noteDetail || !floorEl) return;

      // =========================
      // INIT
      // =========================
      noteDetail.style.pointerEvents = "none";
      noteDetail.setAttribute("transform", "translate(0,0)");
      noteDetail.classList.remove("showed");
      noteDetail.classList.add("hidden");
      if (pendingMsg) pendingMsg.setAttribute("visibility", "hidden");

      svgMain.querySelectorAll("use").forEach((u) => {
        u.style.pointerEvents = "none";
      });

      const paths = svgMain.querySelectorAll("path.pn, path.d, path.e, path.f");
      paths.forEach((p) => {
        p.style.pointerEvents = "all";
        p.style.cursor = "pointer";
      });

      // =========================
      // OUTLINE
      // =========================
      paths.forEach((base) => {
        const outline = base.nextElementSibling;
        if (outline && outline.classList.contains("outline")) {
          base.addEventListener("pointerenter", () => {
            outline.style.opacity = "1";
          });
          base.addEventListener("pointerleave", () => {
            outline.style.opacity = "0";
          });
        }
      });

      // =========================
      // STATE
      // =========================
      let currentPath = null;
      let resetTimer = null;
      let showFrame = null;
      let showFrameNested = null;

      const clearResetTimer = () => {
        if (!resetTimer) return;
        clearTimeout(resetTimer);
        resetTimer = null;
      };

      const clearShowFrame = () => {
        if (showFrame) {
          cancelAnimationFrame(showFrame);
          showFrame = null;
        }

        if (showFrameNested) {
          cancelAnimationFrame(showFrameNested);
          showFrameNested = null;
        }
      };

      const scheduleShow = () => {
        clearShowFrame();

        showFrame = requestAnimationFrame(() => {
          showFrame = null;
          showFrameNested = requestAnimationFrame(() => {
            showFrameNested = null;
            noteDetail.classList.add("showed");
            noteDetail.classList.remove("hidden");
          });
        });
      };

      const setPendingState = (isPending) => {
        pendingHideTargets.forEach((target) => {
          target.setAttribute("visibility", isPending ? "hidden" : "visible");
        });
        if (pendingMsg) {
          pendingMsg.setAttribute(
            "visibility",
            isPending ? "visible" : "hidden",
          );
        }
      };

      // =========================
      // HIDE
      // =========================
      const hideDetail = () => {
        clearShowFrame();
        clearResetTimer();
        noteDetail.classList.remove("showed");
        noteDetail.classList.add("hidden");
        setPendingState(false);

        resetTimer = setTimeout(() => {
          if (!currentPath) {
            noteDetail.setAttribute("transform", "translate(0,0)");
          }
          resetTimer = null;
        }, 150);

        currentPath = null;
      };

      // =========================
      // SHOW
      // =========================
      const showDetail = (path) => {
        clearResetTimer();

        const pathChanged = currentPath !== path;

        const { pn, dtw, dttt, pb, pt, status } = path.dataset;
        if (!pn) return;
        currentPath = path;
        const isPending = status === "pending";
        setPendingState(isPending);

        floorEl.textContent = pn;
        if (details[0])
          details[0].textContent = !isPending && dtw ? dtw + " m²" : "—";
        if (details[1])
          details[1].textContent = !isPending && dttt ? dttt + " m²" : "—";
        if (details[2]) details[2].textContent = !isPending && pt ? pt : "—";
        if (details[3]) details[3].textContent = !isPending && pb ? pb : "—";
        if (pathChanged) {
          const bbox = path.getBBox();
          const bboxDetail = noteDetail.getBBox();
          const cx = bbox.x + bbox.width / 2;
          const cy = bbox.y + bbox.height / 2;

          const ORIGIN_X = 1100;
          const ORIGIN_Y = 250;
          const BW = bboxDetail.width;
          const BH = bboxDetail.height;
          const OFFSET = 12;

          let bx = cx + bbox.width / 2 + OFFSET;
          let by = cy - BH / 2;

          if (bx + BW > 1920) bx = cx - bbox.width / 2 - BW - OFFSET;
          if (bx < 0) bx = OFFSET;
          if (by < 10) by = 10;
          if (by + BH > 980) by = 980 - BH - 10;

          noteDetail.setAttribute(
            "transform",
            `translate(${bx - ORIGIN_X}, ${by - ORIGIN_Y})`,
          );

          if (noteDetail.classList.contains("showed")) {
            clearShowFrame();
          } else {
            scheduleShow();
          }
        } else {
          clearShowFrame();
          noteDetail.classList.add("showed");
        }
      };

      // =========================
      // EVENTS — paths
      // =========================
      paths.forEach((path) => {
        path.addEventListener("pointerenter", () => showDetail(path));
      });

      svgMain.addEventListener("pointerleave", () => hideDetail());
    });
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

    style.textContent = reverse
      ? `@keyframes ${keyframeName} { from { transform: translate3d(-${oneSetWidth}px, 0, 0); } to { transform: translate3d(0, 0, 0); } }`
      : `@keyframes ${keyframeName} { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(-${oneSetWidth}px, 0, 0); } }`;
    document.head.appendChild(style);

    wrapper.style.width = "max-content";

    requestAnimationFrame(() => {
      wrapper.style.animation = `${keyframeName} ${speed}ms linear infinite`;
    });
  };

  const initMarquee = (selector, reverse = false) => {
    const elements = document.querySelectorAll(selector);
    if (!elements.length) return;

    elements.forEach((el) => {
      if (el.classList.contains("marquee-js-init")) return;
      el.classList.add("marquee-js-init");

      const wrapper = el.querySelector(".swiper-wrapper");
      if (!wrapper) return;

      el.style.pointerEvents = "none";
      el.style.overflow = "hidden";

      const allSlidesNow = Array.from(
        wrapper.querySelectorAll(".swiper-slide"),
      );

      const originalCount =
        Number(el.dataset.originalCount) || Math.round(allSlidesNow.length / 4);

      const originalSlides = allSlidesNow.slice(0, originalCount);
      wrapper.innerHTML = "";
      originalSlides.forEach((s) => {
        wrapper.appendChild(s);
      });

      wrapper.style.animation = "none";
      wrapper.style.transform = "";
      wrapper.style.width = "";

      const frag = document.createDocumentFragment();
      for (let i = 0; i < 4; i++) {
        originalSlides.forEach((s) => frag.appendChild(s.cloneNode(true)));
      }
      wrapper.appendChild(frag);

      const speed = Number(el.dataset.speed) || 20000;

      const images = Array.from(wrapper.querySelectorAll("img"));
      const unloaded = images.filter((img) => !img.complete);

      const run = () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            measureAndAnimate(el, wrapper, originalCount, speed, reverse);
          });
        });
      };

      if (unloaded.length === 0) {
        run();
      } else {
        let loaded = 0;
        const onLoad = () => {
          loaded++;
          if (loaded >= unloaded.length) run();
        };
        unloaded.forEach((img) => {
          img.addEventListener("load", onLoad, {
            once: true,
          });
          img.addEventListener("error", onLoad, {
            once: true,
          });
        });
      }
    });
  };

  const initMarqueeTop = () => initMarquee(".marquee-carousel", false);
  const initMarqueeBottom = () =>
    initMarquee(".reverse-marquee-carousel", true);

  const handleDarkBg = () => {
    if (window.innerWidth > mobileBreak) {
      document.documentElement.classList.remove("is-dark-bg");
      return;
    }

    const bgSections = Array.from(document.querySelectorAll(".js-bg"));

    document.documentElement.classList.toggle(
      "is-dark-bg",
      bgSections.some((sec) => {
        const { top, bottom } = sec.getBoundingClientRect();
        return top < window.innerHeight && bottom > 0;
      }),
    );
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
  sliderGallery();
  tabsGallery();
  createPopup({
    id: "mediaPopup",
  });
  createPopup({
    id: "premisesPopup",
    hasTitle: false,
  });
  createPopup({
    id: "premisesDetailPopup",
    className: "premises-detail-popup",
    hasTitle: false,
  });
  initPopup();
  initUtilitiesPairs();
  sliderIntroduction();
  toggleLocation();
  initMapZoom();
  triggerClick();
  fadeInAnimation();
  scrollPage();
  initMarqueeSwiperMobile();
  initMobileNavLinks();
  hoverApartment();
  slideKeyvisual();
  window.addEventListener("load", () => {
    initMarqueeTop();
    initMarqueeBottom();
  });
  window.addEventListener("scroll", handleDarkBg, { passive: true });
})();
