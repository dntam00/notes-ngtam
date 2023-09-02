---
title: Mapping 1-1 relationship in hibernate
published: true
date: 2023-01-04 15:43:23
tags: java, hibernate
description: Hibernate uses @OneToOne annotation to model 1-1 relationship in RDBMS
image: 
---
## Context

<ul>
<li>Hibernate uses <code>@OneToOne</code> annotation to model 1-1 relationship in RDBMS. When we want to travel through entity
relationship, we model these relationships as bidirectional ones. But with <code>one-to-one</code> relationship, <code>hibernate</code> will
trigger additional query to fetch child entity if we map the relationship like others relationship.</li>
<li>In <strong>hibernate context</strong>, an object will be identified by <code>id</code> and <code>entity type</code> (aka class) [1].</li>
</ul>

## Solution

When we model relationship as regular bidirectional `one-to-one` relationship like two entity below:

```java
public class QuizEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne(fetch = LAZY, mappedBy = "quiz", optional = false)
  private QuizResultEntity result;

  // other fields
}

public class QuizResultEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne(fetch = LAZY, optional = false)
  @JoinColumn(name = "quiz_id")
  private QuizEntity quiz;

  // other fields
}
```

and fetch an entity of `QuizEntity type`, hibernate will trigger an additional query to check whether the associated QuizResultEntity object
existing or not to provide appropriate strategy to initialize relationship. If QuizResultEntity object exists, hibernate will create
a proxy, otherwise this field is set to `null`.

So if we add `optional = false` properties to `@OneToOne` annotation, will hibernate trigger additional query?

Unfortunately, based on [1], hibernate will still trigger additional query because the identifier of QuizResultEntity is _unknown_.

Query log:
```sql
select q1_0.id from quiz q1_0 where q1_0.id=?
select q1_0.id,q1_0.quiz_id from quiz_result q1_0 where q1_0.quiz_id=?
```

-> Use `@OneToOne` mapping with `@MapIds` at `QuizResultEntity` side can solve this problem. This will work because at `QuizEntity` side, hibernate knows the `ID` of associated `QuizResult` entity when it queries data.

```java
public class QuizResultEntity {

  @Id
  // Note: we don't use auto generate strategy here.
  // @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne(fetch = LAZY)
  @MapsId
  @JoinColumn(name = "quiz_id")
  private QuizEntity quiz;

  // other fields
}
```

Query log:
```sql
select q1_0.id from quiz q1_0 where q1_0.id=?
```

Source: [one to one mapping](https://github.com/dangngoctam00/learning-spring/tree/master/one-to-one)