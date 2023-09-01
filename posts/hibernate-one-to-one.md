---
title: Mapping 1-1 relationship in hibernate
published: true
date: 2023-01-04 15:43:23
tags: java, hibernate
description: Hibernate uses @OneToOne annotation to model 1-1 relationship in RDBMS
image: 
---
## Preliminary

Mọi số hữu tỉ đều có thể được viết dưới dạng $\frac{a}{b}$ trong đó $a \in \mathbb{Z}$

Hibernate uses @OneToOne annotation to model 1-1 relationship in RDBMS. When we want to travel through entity
relationship, we model these relationships as bidirectional ones. But with @OneToOne relationship, `hibernate` will
trigger additional query to fetch child entity.

## Solution

In **hibernate context**, an object will be identified by `id` and `entity type` (aka class). [1]

When we model relationship as regular bidirectional @OneToOne like two entity below:

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

  @OneToOne(fetch = LAZY, optional = false)
  @JoinColumn(name = "quiz_id")
  private QuizEntity quiz;

  // other fields
}
```

and fetch an entity of QuizEntity, hibernate will trigger an additional query to check whether the associated QuizResultEntity object
existing or not to provide appropriate strategy to initialize relationship. If QuizResultEntity object exists, hibernate will create
a proxy, otherwise this field is set to `null`.

So if we add `optional = false` properties to @OneToOne annotation, will hibernate trigger additional query?

Unfortunately, based on [1], hibernate will still trigger additional query because the identifier of QuizResultEntity is _unknown_.

-> Use @OneToOne with `@MapIds` can solve this problem.

```java
public class QuizResultEntity {

  @OneToOne(fetch = LAZY)
  @MapsId
  @JoinColumn(name = "quiz_id")
  private QuizEntity quiz;

  // other fields
}
```

By mapping this way, child entity will share the primary key with parent entity (foreign key and primary key) and when fetching parent entity,
it will know the identifier of child entity, so the additional query is no longer triggered.