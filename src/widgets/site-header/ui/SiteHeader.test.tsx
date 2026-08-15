import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo } from "@/widgets/site-header/ui/logo";
import { SiteHeader } from "@/widgets/site-header/ui/site-header";

const USER = {
  login: "octocat",
  name: "The Octocat",
  avatarUrl: "https://avatars.githubusercontent.com/u/583231",
};

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
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "Patchwork" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("로그인 전에는 사용자 메뉴를 감춘다", () => {
    render(<SiteHeader />);
    expect(
      screen.queryByRole("link", { name: "Dashboard" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "로그아웃" }),
    ).not.toBeInTheDocument();
  });

  it("로그인 후에는 대시보드·README 링크를 보여준다", () => {
    render(<SiteHeader user={USER} />);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("link", { name: "README" })).toHaveAttribute(
      "href",
      "/export",
    );
  });

  it("사용자 이름과 avatar로 GitHub 프로필을 잇는다", () => {
    render(<SiteHeader user={USER} />);
    const profile = screen.getByRole("link", { name: "The Octocat" });
    expect(profile).toHaveAttribute("href", "https://github.com/octocat");
    expect(screen.getByRole("presentation")).toHaveAttribute(
      "src",
      USER.avatarUrl,
    );
  });

  it("이름이 없으면 login을 대신 보여준다", () => {
    render(<SiteHeader user={{ ...USER, name: null }} />);
    expect(screen.getByRole("link", { name: "octocat" })).toBeInTheDocument();
  });

  it("로그아웃은 POST 폼으로 보낸다", () => {
    render(<SiteHeader user={USER} />);
    const button = screen.getByRole("button", { name: "로그아웃" });
    const form = button.closest("form");
    expect(form).toHaveAttribute("action", "/api/auth/logout");
    expect(form).toHaveAttribute("method", "post");
  });
});
