import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo } from "@/widgets/site-header/ui/Logo";
import { SiteHeader } from "@/widgets/site-header/ui/SiteHeader";
import { dictionaryOf } from "@/shared/lib/i18n-server";

const USER = {
  login: "octocat",
  name: "The Octocat",
  avatarUrl: "https://avatars.githubusercontent.com/u/583231",
};

const KO = dictionaryOf("ko");
const EN = dictionaryOf("en");

describe("Logo", () => {
  it("기본 크기는 20px이다", () => {
    const { container } = render(<Logo />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "20");
  });

  it("크기를 지정할 수 있다", () => {
    const { container } = render(<Logo size={40} />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "40");
  });

  it("네 개의 패치 중앙을 열쇠구멍 형태로 비운다", () => {
    const { container } = render(<Logo />);
    const mask = container.querySelector("mask");

    expect(container.querySelectorAll("g > rect")).toHaveLength(4);
    expect(mask?.querySelector("circle")).toBeInTheDocument();
    expect(mask?.querySelector("path")).toBeInTheDocument();
    expect(container.querySelector("g")).toHaveAttribute(
      "mask",
      `url(#${mask?.id})`,
    );
  });
});

describe("SiteHeader", () => {
  it("항상 홈으로 가는 브랜드 링크가 있다", () => {
    render(<SiteHeader dict={KO} />);
    expect(screen.getByRole("link", { name: "Patchwork" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("로그인 전에는 사용자 메뉴를 감춘다", () => {
    render(<SiteHeader dict={KO} />);
    expect(
      screen.queryByRole("link", { name: "Dashboard" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "로그아웃" }),
    ).not.toBeInTheDocument();
  });

  it("로그인 후에는 대시보드·README 링크를 보여준다", () => {
    render(<SiteHeader user={USER} dict={KO} />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("link", { name: "README" })).toHaveAttribute(
      "href",
      "/export",
    );
  });

  it("현재 화면을 주요 이동 경로에서 구분한다", () => {
    const { rerender } = render(
      <SiteHeader user={USER} dict={KO} active="dashboard" />,
    );

    expect(screen.getByRole("navigation")).toHaveClass(
      "border-b",
      "border-border",
    );
    const dashboard = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboard).toHaveAttribute("aria-current", "page");
    expect(dashboard).toHaveClass(
      "text-accent",
      "after:h-[3px]",
      "after:rounded-full",
      "after:bg-accent",
    );
    expect(screen.getByRole("link", { name: "README" })).not.toHaveAttribute(
      "aria-current",
    );

    rerender(<SiteHeader user={USER} dict={KO} active="export" />);
    expect(screen.getByRole("link", { name: "README" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("사용자 이름과 avatar로 GitHub 프로필을 잇는다", () => {
    render(<SiteHeader user={USER} dict={KO} />);
    const profile = screen.getByRole("link", { name: "The Octocat" });
    expect(profile).toHaveAttribute("href", "https://github.com/octocat");
    expect(screen.getByLabelText("The Octocat")).toHaveTextContent(
      "The Octocat",
    );
    expect(screen.getByRole("presentation")).toHaveAttribute(
      "src",
      USER.avatarUrl,
    );
  });

  it("이름이 없으면 login을 대신 보여준다", () => {
    render(<SiteHeader user={{ ...USER, name: null }} dict={KO} />);
    expect(screen.getByRole("link", { name: "octocat" })).toBeInTheDocument();
  });

  it("로그아웃은 POST 폼으로 보낸다", () => {
    render(<SiteHeader user={USER} dict={KO} />);
    const button = screen.getByRole("button", { name: "로그아웃" });
    const form = button.closest("form");
    const menu = button.closest("details");
    expect(form).toHaveAttribute("action", "/api/auth/logout");
    expect(form).toHaveAttribute("method", "post");
    expect(menu).toContainElement(screen.getByLabelText("The Octocat"));
  });

  it("사전을 바꾸면 문구도 함께 바뀐다", () => {
    render(<SiteHeader user={USER} dict={EN} />);
    expect(
      screen.getByRole("button", { name: "Sign out" }),
    ).toBeInTheDocument();
  });

  /** 보는 방식을 정하는 것 둘은 로그인 전에도 쓸 수 있어야 한다. */
  it("언어·테마 전환은 로그인 전에도 늘 있다", () => {
    render(<SiteHeader dict={KO} />);

    expect(screen.getByRole("form", { name: "언어" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "테마" })).toBeInTheDocument();
  });

  it("고른 테마를 전환 자리에 그대로 보여준다", () => {
    render(<SiteHeader theme="dark" dict={KO} />);
    expect(screen.getByLabelText("테마: 어둡게")).toBeInTheDocument();
  });

  /** 머리를 그리는 자리가 여럿이라, 넘기지 않은 곳에서 깨지지 않아야 한다. */
  it("테마를 넘기지 않으면 시스템 설정으로 본다", () => {
    render(<SiteHeader dict={KO} />);
    expect(screen.getByLabelText("테마: 시스템 설정")).toBeInTheDocument();
  });
});
